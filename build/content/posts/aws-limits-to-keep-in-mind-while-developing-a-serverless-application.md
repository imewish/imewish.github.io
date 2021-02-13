+++
date = 2021-02-10T18:30:00Z
draft = true
image_upload = ""
layout = "post"
permalink = "aws-limits-to-keep-in-mind-while-developing-serverless-app"
tags = ["limit", "aws", "serverless"]
title = "AWS Limits To Keep In Mind While Developing A Serverless Application"

+++
Serverless is great, it helps companies to focus on product and application development without worrying much about the infrastructure and scaling. But there are some soft and hard limits for every AWS service which we need to keep in mind when we are developing a serverless application. These limits are meant to protect the customer as well as the provider against any unintentional use

In this article, we will talk about some of those limits and how to avoid them.

### Deployment Limits

#### Lambda

\- **50 MB**: **_Function Deployment Package Size_**, **250 MB**: **_Size of code/dependencies that you can zip into a deployment package_** (uncompressed .zip/.jar size)

There is a limit of 50MB on the package size of the code which we upload to lambda.

This limit is applied when we try to create or update a lambda function with the AWS CLI.

If you try to create the function from the AWS Web console it is limited to 10MB. We can avoid these limitations by uploading the ZIP file to S3 and create the function.

The total size of code/dependencies we can compress into the deployment package is limited to 250MB. In simple REST API cases, we may not hit these limits. But when we have to use binaries like FFMPEG or  ML/AI libraries like **scikit-learn** or **ntlk** with lambda could hit this limit. these dependencies are high in size

**Are these a soft limit? : NO**

**How to Avoid?**

\- Use Serverless framework

By default serverless framework zip and deploys your code first to S3 and deploys it lambda via cloud formation.

\- **Use** **WebPack**

\*_WebPack_* is a well-known tool serving to create bundles of assets (code and files). Webpack helps to reduce and optimize the packaging size by

* Include only the code used by your function
* Optimize your NPM dependencies 
* Use a single file for your source code

Optimizing and reducing the package size will also help to reduce the cold start of the functions.

\- **75GB**: **_Total Size Of All Deployment Packages That Can Be Uploaded Per Region_**

This limit is a region-wide soft limit. It can be increased by service Quota limit increase.  Most of the time people get hit by this limit is when they have a huge number of lambda functions and every time we update a new code a new version of lambda is created. Each version has its own deployment package it will be counted towards this limit.  

**Is it a soft limit? : YES** 

**How to Avoid?**  

* Version your code and do not version functions. (Except for lambda@edge, For lambda@edge versioning is a must)  - Remove older or unused versions
* If you are updating the function via AWS CLI use `--no-publish` flag not to create a new version update**.**
* Keep only the latest version of the lambda function. Remove the older versions, and if we really needed to keep a specific older version of the function, add an **ALIAS** to those versions and remove all the unused versions.

\- **512MB: Amount of data that be stored inside lambda instance during execution (/tmp)**

    If you want to download a file and store the **/tmp** directory to process it during the execution, this limit will be applied. You cannot store files into this directory only up to 512 MB, even if it is a single file or multiple files. 
    
    #####Is it a soft limit? : NO#####
    
    #####How to avoid?#####
    
    - Use ****the \[**Nodejs Stream\]([https://nodejs.org/dist/latest-v10.x/docs/api/stream.html](https://nodejs.org/dist/latest-v10.x/docs/api/stream.html "https://nodejs.org/dist/latest-v10.x/docs/api/stream.html"))** method to read and process and write files without loading the whole file into lambdas ****filesystem

\- **6MB: Lambda payload limit**

    This means We cannot POST more than 6MB of data to Lambda through API Gateway. So if we build an image or video uploading API to upload files to S3, we are limited to this 6MB Limit.
    
    #####Is it a soft limit? : NO#####
    
    #####How to avoid?
    
    There is a couple of workarounds to get rid of this limit.
    
    - Use a pre-signed S3 URL.
    
        In this case,
    
        - The client makes an HTTP GET request to API Gateway, and the Lambda function generates and returns a
    
        - The client uploads the image to S3 directly, using the pre-signed S3 URL

\### **Cloudformation**

If you are using the **serverless framework** for deploying your application, as your application grows you may hit some of the cloudformation limits when you deploy as serverless framework uses cloudformation behind the scenes for deploying services.

\- **A CloudFormation stack can have at most 500 resources**

    Let's take an example of a backend Application with multiple REST API's. This Application may have multiple Lambda functions, API Gateway Endpoints, Methods, Custom Domains, SNS Topics, DynamoDB, S3 Buckets, etc. When we deploy this application to AWS with cloudformation, it will create cloudformation resources for all the mentioned services in a single cloudformation stack. There will be multiple resources created per services(IAM roles, IAM Policies, Cloudwatch log groups). In the case of a single lambda function following resources will be created per each function,
    
    - AWS::Lambda::Function
    
    - AWS::Lambda::Version
    
    - AWS::Logs::LogGroup
    
    Plus additional resources will be added if we attach event-sources like API Gateway, SNS to the function
    
    When the application grows, the total number of resources will also increase. And when it hit the 500 limit the deployments will start failing.
    
    #####Is it a soft limit? : NO#####
    
    #####How to Avoid?#####

\- Use **Cloudformation Nested Stacks** to Reuse Common Template Patterns,

As your infrastructure grows, common patterns can emerge in which you declare the same components in each of your templates. You can separate out these common components and create dedicated templates for them. That way, you can mix and match different templates but use nested stacks to create a single, unified stack. The nested solutions may buy you little time to avoid this limit, but as the stack grows it will be hard to manage it.

\- Use **serverless split stack plugin**

This plugin migrates CloudFormation resources into nested stacks in order to work around the 200 resource limit. There are built-in migration strategies that can be turned on or off as well as defining your own custom migrations.

The recommended way is, Try to create your services(Multiple Micro Services) as small as you can. Keep an eye on no resources every time you deploy the stack, and when you think the stack may hit the limit,  break some of its features into alternative service.

\- **An IAM role policy can have up to 10,240 characters**

    This is one of the other limits we may hit when the stack grows. This happens when the whole application uses a single IAM role. By default serverless will include all the basic and custom IAM policies for all the functions used by the application into one single IAM role. 
    
    #####How to Avoid?#####
    
    - Create individual IAM roles for each function in the cloudformation stack instead of a single large IAM role for the whole stack. Using per-function roles is a recommended best practice to achieve and maintain the least privilege setup for your Lambda functions.

\- With the serverless framework, there are a couple of good plugins that help to do this.

\## **Summary**

It is a good practice to know all the limits of all the AWS services that you are going to use when designing your infrastructure and develop the application. This will help us with the following,

\- Avoid redesigning the architecture in the future when we hit the limit

\- Design scalable and fault-tolerant serverless infrastructure by planning and implementing workarounds to avoid hitting the limits or calculating and increasing the soft limit of each service as per the requirement of the application