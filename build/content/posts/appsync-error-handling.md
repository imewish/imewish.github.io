---
layout: post
title: 'Building a Robust Error Handling System for AWS AppSync APIs with Appsync JS Resolvers'
permalink: aws-appsync-robust-error-handling
date: 2025-11-23T18:30:00.000Z
tags:
  - aws
  - serverless
  - appsync
  - lambda
  - error
  - error handling
  - appsync error handling
  - aws appsync
  - best practice
  - appsync error handling best practices
---

## Introduction

If you've built REST APIs with AWS API Gateway, you know how nice it is to return structured error responses with proper HTTP status codes, error types, and detailed context. Then you switch to GraphQL with AppSync, and suddenly your beautiful error handling becomes... generic.

```json
{ "errors": [{ "message": "Error" }] }
```

That's it. No error types. No structured context. Just a string.

**This doesn't have to be the case.**

In this post, I'll show you how to bring API Gateway-style error handling to your GraphQL APIs using AppSync JavaScript resolvers and custom exception classes. We'll transform generic GraphQL errors into structured, type-safe responses that your clients can actually use.

By the end, you'll have:

- **Custom exception classes** with type-safe context
- **Middleware** that automatically transforms errors
- **AppSync JS resolvers** that propagate structured errors
- **Client-friendly error responses** that rival REST APIs

All with real, production-ready code you can implement today.

## The Problem: GraphQL's Generic Error Responses

If you've worked with REST APIs and AWS API Gateway, you're probably familiar with structured error responses:

```json
// REST API error response (what we want)
{
  "statusCode": 400,
  "errorType": "ValidationException",
  "message": "Invalid email format",
  "errorInfo": {
    "field": "email",
    "constraint": "email",
    "receivedValue": "not-an-email"
  }
}
```

This is great! The client knows exactly what went wrong, which field failed validation, and why.

Now let's look at what you typically get with GraphQL/AppSync when using generic error handling:

```json
// Generic GraphQL error (what we're replacing)
{
  "data": null,
  "errors": [
    {
      "message": "Error",
      "path": ["getUser"],
      "locations": [{ "line": 2, "column": 3 }]
    }
  ]
}
```

See the problem? You lose all that rich context. No error types, no additional information, just a vague message.

### Why This Happens

When you throw errors in Lambda and don't handle them properly:

```javascript
// The problematic approach
export const handler = async (event) => {
  try {
    const user = await database.getUser(id);
  } catch (error) {
    // This becomes a generic GraphQL error
    throw new Error('Something went wrong');
  }
};
```

AppSync receives the raw error and converts it to a generic GraphQL error. You lose:

1. **Error types**: Can't differentiate between validation, auth, or server errors
2. **Structured context**: No field names, constraint information, or additional data
3. **Client actionability**: Frontend can't handle different error scenarios appropriately
4. **Type safety**: No TypeScript interfaces, just string messages
5. **Debugging context**: Production errors are nearly impossible to diagnose

### What We're Building

Our goal is to bring API Gateway-style error handling to GraphQL using:

- **Custom exception classes** (replacing generic `Error` objects)
- **Middleware-based transformation** (converting exceptions to structured responses)
- **AppSync JS resolvers** (propagating structured errors through GraphQL)
- **Type-safe error schemas** (making errors as reliable as successful responses)

The result? GraphQL errors that look like this:

```json
{
  "data": null,
  "errors": [
    {
      "message": "Invalid email format",
      "errorType": "VALIDATION_EXCEPTION",
      "errorInfo": {
        "field": "email",
        "constraint": "email",
        "receivedValue": "not-an-email"
      },
      "path": ["getUser"],
      "locations": [{ "line": 2, "column": 3 }]
    }
  ]
}
```

Now we have the best of both worlds: GraphQL's query flexibility with REST API's structured error responses.

---

**📌 TL;DR:** We're replacing generic GraphQL errors with API Gateway-style structured responses by:
1. Using custom exception classes instead of generic `Error` objects
2. Transforming exceptions to response objects via middleware
3. Using AppSync JS resolvers to propagate the structure through GraphQL's `util.error()`

Result: Clients get the same rich error context they'd expect from a REST API.

## Our Solution: A Three-Layer Approach

Our error handling system operates across three distinct layers:

### Layer 1: Lambda (Where Errors Originate)

This is where your business logic lives and where most errors occur. We use:

- **Custom exception classes** for type-safe error creation
- **Middy middleware** to intercept and transform errors
- **Structured error responses** that flow to AppSync

### Layer 2: AppSync (Error Transformation)

AppSync sits between your Lambda functions and clients, transforming errors into GraphQL-compliant responses:

- **JavaScript resolvers** detect error responses
- **Built-in utilities** create proper GraphQL errors
- **Automatic enrichment** adds path and location information

### Layer 3: Client (Error Consumption)

Your frontend receives structured errors that are easy to handle:

- **Type-safe error interfaces** in TypeScript
- **Centralized error handling** logic
- **User-friendly error messages**

### The Complete Flow

Here's how an error travels through the system:

```
1️⃣ Lambda Handler
   throw new ValidationException('Invalid email', { field: 'email' })
   ↓
2️⃣ Middy Middleware
   Catches exception → Returns structured response
   { errorMessage: '...', errorType: '...', errorInfo: {...} }
   ↓
3️⃣ AppSync JS Resolver
   Detects error response → Calls util.error()
   Transforms to GraphQL error format
   ↓
4️⃣ GraphQL Response
   {
     "errors": [{
       "message": "Invalid email",
       "errorType": "VALIDATION_EXCEPTION",
       "errorInfo": { "field": "email" }
     }]
   }
   ↓
5️⃣ Client
   Receives structured error → Shows appropriate UI
```

**Key insight:** We never let AppSync see a thrown error. We always return structured response objects that the JS resolver transforms into GraphQL errors with full context.

Let's build each layer.

## Building Custom Exception Classes

First, we create a base exception class that all our custom errors will extend:

```typescript
export class CustomException<TInfo extends Record<string, unknown> | null = null> extends Error {
  readonly info: TInfo | null;

  constructor(message: string, info: TInfo | null = null) {
    super(message);
    this.info = info;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

The magic here is the generic `TInfo` parameter. This lets us attach type-safe context to any error:

```typescript
// Define what information this error carries
interface UserValidationError {
  field: string;
  constraint: string;
  receivedValue: unknown;
  allowedValues?: string[];
}

// Throw with type-safe context
throw new ValidationException<UserValidationError>('Invalid user role', {
  field: 'role',
  constraint: 'enum',
  receivedValue: 'super_admin',
  allowedValues: ['user', 'admin', 'moderator'],
});
```

TypeScript now knows exactly what's in `error.info`—no guessing, no casting.

### The Four Exception Types

We define four core exception types that cover most scenarios:

```typescript
// 1. ValidationException - Bad input from client
export class ValidationException<TInfo extends Record<string, unknown> | null = null>
  extends CustomException<TInfo> {}

// 2. UnauthorizedException - Missing or invalid auth
export class UnauthorizedException<TInfo extends Record<string, unknown> | null = null>
  extends CustomException<TInfo> {}

// 3. ForbiddenException - Valid auth but insufficient permissions
export class ForbiddenException<TInfo extends Record<string, unknown> | null = null>
  extends CustomException<TInfo> {}

// 4. InternalServiceError - Server-side failures
export class InternalServiceError<TInfo extends Record<string, unknown> | null = null>
  extends CustomException<TInfo> {}
```

These map nicely to HTTP status codes (400, 401, 403, 500) while remaining GraphQL-friendly.

## Middleware: The Error Transformer

Now comes the key piece: middleware that intercepts exceptions and transforms them into structured responses.

We use [Middy](https://middy.js.org/), a popular middleware framework for Lambda:

```typescript
import { MiddlewareObj } from '@middy/core';

export const exceptionHandlerMiddleware = (): MiddlewareObj => {
  return {
    onError: (request) => {
      const { error } = request;

      // Handle ValidationException
      if (error instanceof ValidationException) {
        return (request.response = {
          errorMessage: error.message,
          errorType: 'VALIDATION_EXCEPTION',
          errorInfo: error.info || null,
        });
      }

      // Handle UnauthorizedException
      if (error instanceof UnauthorizedException) {
        return (request.response = {
          errorMessage: error.message,
          errorType: 'UNAUTHORIZED_EXCEPTION',
          errorInfo: error.info || null,
        });
      }

      // Handle ForbiddenException
      if (error instanceof ForbiddenException) {
        return (request.response = {
          errorMessage: error.message,
          errorType: 'FORBIDDEN_EXCEPTION',
          errorInfo: error.info || null,
        });
      }

      // Handle unknown errors
      return (request.response = {
        errorMessage: error?.message || 'INTERNAL_SERVER_ERROR',
      });
    },
  };
};
```

The beauty of this approach: your business logic just throws exceptions naturally, and the middleware handles the transformation. No `try/catch` blocks everywhere, no manual response formatting.

## Putting It Together: Lambda Handler

Here's what a complete Lambda handler looks like:

```typescript
import middy from '@middy/core';
import { AppSyncResolverEvent } from 'aws-lambda';
import { exceptionHandlerMiddleware } from '../utils/middlewares/exceptions';
import { ValidationException, UnauthorizedException } from '../utils/exceptions/main';

export const base = async (event: AppSyncResolverEvent<{ id: string }>) => {
  // Simple validation - just throw!
  if (!event.arguments?.id) {
    throw new ValidationException('ID is required', {
      field: 'id',
      constraint: 'required',
    });
  }

  // Auth check
  if (!event.identity?.sub) {
    throw new UnauthorizedException('Authentication required');
  }

  // Business logic
  const item = await fetchItemFromDatabase(event.arguments.id);

  if (!item) {
    throw new ValidationException('Item not found', {
      field: 'id',
      value: event.arguments.id,
    });
  }

  return item;
};

// Wrap with middleware
export const handler = middy(base).use(exceptionHandlerMiddleware());
```

Notice how clean the business logic is? No error handling boilerplate—just throw and let the middleware handle it.

## AppSync JS Resolvers: The Critical Bridge

Here's where the magic happens. This is what transforms our structured Lambda responses into proper GraphQL errors—without this piece, we'd still have generic errors.

**The key insight:** Instead of letting AppSync convert Lambda errors into generic GraphQL errors, we:

1. Return structured error **responses** from Lambda (not thrown errors)
2. Use AppSync JS resolvers to detect these error responses
3. Transform them into GraphQL errors with `util.error()`, preserving all our structure

This is how we replicate API Gateway's error handling in GraphQL:

```javascript
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {
    operation: 'Invoke',
    invocationType: 'RequestResponse',
    payload: {
      arguments: ctx.arguments,
      identity: ctx.identity,
      info: ctx.info,
      source: ctx.source,
      stash: ctx.stash,
      request: ctx.request,
    },
  };
}

export function response(ctx) {
  const { result } = ctx;

  // Handle Lambda execution errors (timeout, crash, etc.)
  if (ctx.error) {
    util.error('Internal Error', 'InternalError');
  }

  // HERE'S THE KEY: Detect our structured error responses
  // Lambda returned: { errorMessage, errorType, errorInfo }
  // We transform it to a GraphQL error while preserving structure
  if (result && result.errorMessage) {
    util.error(
      result.errorMessage,  // Human-readable message
      result.errorType,     // Error type (VALIDATION_EXCEPTION, etc.)
      result.data || null,  // Partial response can be provided in case of errors
      result.errorInfo      // Our custom context object!
    );
  }

  // Success case - return the result
  return result;
}
```

### Why This Works

**Without JS Resolvers (Generic GraphQL):**
```
Lambda throws Error → AppSync catches → Generic GraphQL error
Result: { "errors": [{ "message": "Error" }] }
```

**With JS Resolvers (Structured Errors):**
```
Lambda returns { errorMessage, errorType, errorInfo }
→ JS Resolver detects error response
→ util.error() creates GraphQL error with full context
Result: { "errors": [{ "message": "...", "errorType": "...", "errorInfo": {...} }] }
```

### The util.error() Function

This is AppSync's built-in function for creating GraphQL errors. It accepts four parameters:

```javascript
util.error(
  message,    // string: Human-readable error message
  errorType,  // string: Error type identifier (like HTTP status)
  data,       // any: Optional data to return (rarely used)
  errorInfo   // object: Custom structured context (our secret sauce!)
);
```

When called, it:
- Immediately stops resolver execution
- Sets `data: null` in the GraphQL response
- Creates an error object in the `errors` array
- **Preserves our errorType and errorInfo fields**

This is how we get API Gateway-style structured errors in GraphQL.

## The Final Result: API Gateway-Style GraphQL Errors

After all this processing, here's what your client receives. Notice how it combines GraphQL's structure with REST API's rich error context:

```json
{
  "data": null,
  "errors": [
    {
      "message": "Invalid email format",
      "errorType": "VALIDATION_EXCEPTION",
      "errorInfo": {
        "field": "email",
        "constraint": "email",
        "receivedValue": "not-an-email"
      },
      "path": ["getUser"],
      "locations": [{ "line": 2, "column": 3 }]
    }
  ]
}
```

**Compare this to a REST API Gateway response:**

```json
{
  "statusCode": 400,
  "errorType": "ValidationException",
  "message": "Invalid email format",
  "errorInfo": {
    "field": "email",
    "constraint": "email",
    "receivedValue": "not-an-email"
  }
}
```

We've replicated the structure! The client gets:

- ✅ **Error type** (`errorType`) - Just like REST status codes, identify error categories
- ✅ **Human-readable message** (`message`) - Clear explanation of what went wrong
- ✅ **Structured context** (`errorInfo`) - Field-level details, constraints, and debugging data
- ✅ **GraphQL metadata** (`path`, `locations`) - Bonus: know exactly where in the query it failed

This is no longer a generic `{ "message": "Error" }`. This is a production-grade error response.

## Client-Side Error Handling

With structured errors, client-side handling becomes straightforward:

```typescript
// Define error types
type ErrorType = 'VALIDATION_EXCEPTION' | 'UNAUTHORIZED_EXCEPTION' | 'FORBIDDEN_EXCEPTION';

interface GraphQLError {
  message: string;
  errorType?: ErrorType;
  errorInfo?: Record<string, unknown>;
  path: string[];
  locations: Array<{ line: number; column: number }>;
}

// Centralized error handler
function handleGraphQLError(error: GraphQLError) {
  const { errorType, message, errorInfo } = error;

  switch (errorType) {
    case 'VALIDATION_EXCEPTION':
      // Show specific field errors
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: message,
        details: errorInfo,
      });
      break;

    case 'UNAUTHORIZED_EXCEPTION':
      // Redirect to login
      redirectToLogin();
      break;

    case 'FORBIDDEN_EXCEPTION':
      // Show access denied message
      showToast({
        type: 'error',
        title: 'Access Denied',
        message: message,
      });
      break;

    default:
      // Generic error handling
      showToast({
        type: 'error',
        title: 'Error',
        message: message || 'An unexpected error occurred',
      });
  }
}
```

## Production Considerations

### Security: Don't Leak Sensitive Information

Never expose sensitive data in error messages:

```typescript
// BAD - Exposes internal details
throw new ValidationException(
  `Database query failed: SELECT * FROM users WHERE api_key='sk_live_abc123'`
);

// GOOD - Generic message with safe context
throw new InternalServiceError('Database operation failed', {
  operation: 'query',
  table: 'users'
});
```

Consider sanitizing error info in production:

```typescript
export const exceptionHandlerMiddleware = (): MiddlewareObj => {
  return {
    onError: (request) => {
      const { error } = request;
      const isProd = process.env.NODE_ENV === 'production';

      if (error instanceof ValidationException) {
        return (request.response = {
          errorMessage: error.message,
          errorType: 'VALIDATION_EXCEPTION',
          errorInfo: isProd ? sanitizeErrorInfo(error.info) : error.info,
        });
      }
      // ... other handlers
    },
  };
};

function sanitizeErrorInfo(info: any) {
  const sanitized = { ...info };
  delete sanitized.internalId;
  delete sanitized.stackTrace;
  delete sanitized.apiKeys;
  return sanitized;
}
```

## Benefits of This Approach

After implementing this system, you'll notice several improvements:

1. **Consistency**: Every error follows the same structure
2. **Type Safety**: TypeScript catches error handling mistakes at compile time
3. **Debuggability**: Rich context makes production debugging easier
4. **Developer Experience**: Clear error messages and types make the API a joy to use
5. **Separation of Concerns**: Business logic stays clean, error handling is centralized
6. **Client-Friendly**: Structured errors are easy to handle in frontend code

## Common Patterns and Examples

### Validation Errors

```typescript
// Required field
if (!input.email) {
  throw new ValidationException('Email is required', {
    field: 'email',
    constraint: 'required',
  });
}

// Format validation
if (!isValidEmail(input.email)) {
  throw new ValidationException('Invalid email format', {
    field: 'email',
    constraint: 'email',
    receivedValue: input.email,
  });
}

// Range validation
if (input.age < 18 || input.age > 120) {
  throw new ValidationException('Age must be between 18 and 120', {
    field: 'age',
    constraint: 'range',
    receivedValue: input.age,
    min: 18,
    max: 120,
  });
}
```

### Authorization Errors

```typescript
// Missing authentication
if (!ctx.identity?.sub) {
  throw new UnauthorizedException('Authentication required', {
    reason: 'missing_token',
  });
}

// Expired token
if (isTokenExpired(token)) {
  throw new UnauthorizedException('Token has expired', {
    reason: 'token_expired',
    expiredAt: token.expiresAt,
  });
}

// Insufficient permissions
const hasPermission = await checkPermission(userId, 'delete:items');
if (!hasPermission) {
  throw new ForbiddenException('Insufficient permissions', {
    requiredPermission: 'delete:items',
    userRole: userRole,
  });
}
```

### Service Errors

```typescript
// Database errors
try {
  await database.query(sql);
} catch (error) {
  throw new InternalServiceError('Database operation failed', {
    operation: 'query',
    table: 'users',
    retryable: true,
  });
}

// External API failures
try {
  const response = await externalAPI.fetch(url);
} catch (error) {
  throw new InternalServiceError('External service unavailable', {
    service: 'PaymentProvider',
    statusCode: error.statusCode,
    retryable: error.statusCode >= 500,
  });
}
```

### Why This Matters

Building a robust error handling system takes effort upfront, but pays dividends as your application grows. You'll spend less time debugging vague errors and more time building features. More importantly, **your clients get the same quality of error handling they'd expect from a REST API**, but with GraphQL's query flexibility.


## Further Reading

- [AWS AppSync Documentation](https://docs.aws.amazon.com/appsync/)
- [Middy Middleware Framework](https://middy.js.org/)
- [GraphQL Error Handling Best Practices](https://spec.graphql.org/October2021/#sec-Errors)
- [AWS Lambda Error Handling](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-exceptions.html)

---

*Have questions or suggestions? Found this helpful? Let me know in the comments below!*
