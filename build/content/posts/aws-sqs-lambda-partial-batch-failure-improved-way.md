---
layout: posts
title: 'AWS SQS With Lambda, Partial Batch Failure Handling: Improved Way'
permalink: aws-sqs-lambda-partial-batch-failure-improved-way
date: 2024-03-11T18:30:00.000Z
---

This article is the continuation of one ([link](https://vishnuprasad.blog/posts/aws-sqs-partial-failure-handling/)) of the previous articles, where I explained how to handle partial batch failures in SQS when using it with AWS Lambda. At the time of writing that article, there was no native way of handling this. Two feasible methods were, either using a batch size of one or deleting each successful message after processing.

Quick Recap On, What Happens If One Of The Messages In The Batch Failed To Process.

* If you don’t throw an error on your function and one of the messages doesn’t process correctly the message will be lost
* If you catch and throw an error, the whole batch will be sent back to the queue including the ones which were processed successfully. This batch will be retried again multiple times based on the maxReceiveCount configuration if the error is not resolved. This will lead to the reprocessing of successful messages multiple times
* if you have configured a Dead letter Queue with your SQS Queue the failed batch will end up there once the ReceiveCount for a message exceeds the maxReceiveCount. The successfully processed message will also end up in the DLQ. If the consumer of this DLQ can differentiate between failure and success messages in the batch we are good to go.

Now, let's explore how we can handle partial batches in a more effective and refined manner.

AWS Lambda now supports partial batch response for SQS as an event source. What does this mean?

Now when you configure SQS as an event source with AWS Lambda, you can add a config called functionResponseType = ReportBatchItemFailures.

![](</uploads/Screenshot 2024-03-12 at 7.11.42 PM.png>)

Enabling this configuration instructs Lambda to abstain from retrying messages from processed batches, opting to delete such messages from the queue. Instead, it concentrates on handling only the messages that have experienced failures.

However, there's a caveat: simply enabling this configuration doesn't achieve our desired outcome. We need to make changes at the code level within the Lambda function.

Here’s How we do it.

```typescript
import type { SQSHandler } from 'aws-lambda';

const main: SQSHandler = async (event, context): Promise<SQSBatchResponse> => {
  const failedMessageIds: { id: string }[] = [];

  for (const record of event.Records) {
    try {
      await processMessageAsync(record, context);
    } catch (error) {
      failedMessageIds.push(event.messageId);
    }
  }

  return {
    batchItemFailures: failedMessageIds.map(id => {
      return {
        itemIdentifier: id
      }
    })
  }
};

async function processMessageAsync(record: any, context: Context): Promise<void> {
  if (!record.body) {
    throw new Error('No Body in SQS Message.');
  }
  context.log(`Processed message ${record.body}`);
}

```

In the provided code snippet, our approach involves iterating through the batch of messages received from Lambda. We catch all exceptions using a try-catch block, retrieve the IDs of the failed messages, and return them at the end of the invocation in the following manner.

```javascript
{
  "batchItemFailures": [
    {
      "itemIdentifier": "messageId4"
    },
    {
      "itemIdentifier": "messageId8"
    }
  ]
}
```

In conclusion, while discussing the integration of SQS with AWS Lambda, we've explored the challenge of handling partial batch failures. In previous articles, we outlined two feasible methods: adjusting the batch size to one or individually deleting successfully processed messages. Despite the absence of a native solution at the time, these approaches provided effective workarounds. By addressing this issue, we aim to streamline and enhance the reliability of message-processing workflows within AWS Lambda and SQS
