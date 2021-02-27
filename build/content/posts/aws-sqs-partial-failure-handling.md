+++
date = 2021-02-23T18:30:00Z
draft = true
image_upload = ""
layout = "post"
permalink = "aws-sqs-partial-failure-handling-lambda"
tags = ["aws", "sqs", "serverless"]
title = "AWS SQS Partial Failure Handling with Lambda trigger"

+++
Amazon Web Services released SQS triggers for Lambda functions in June 2018. You can use an AWS Lambda function to process messages in an Amazon Simple Queue Service (Amazon SQS) queue. Lambda polls the queue and invokes your Lambda function [synchronously](https://docs.aws.amazon.com/lambda/latest/dg/invocation-sync.html) with an event that contains queue messages. Lambda reads messages in batches and invokes your function once for each batch. When your function successfully processes a batch, Lambda deletes its messages from the queue.

### How Does Lambda Process The Messages?

By default, Lambda invokes your function as soon as records are available in the SQS queue. Lambda will poll up to 10(Can be increased) messages in your queue at once and will send that batch to the function. This means each invocation of lambda will receive up to 10 messages from the Queue to process. Once all messages in the batch are processed lambda will delete the batch from the queue and will start processing the next batch.

### What Happens If One Of The Message In The Batch Failed To Process?

* If you don't throw an error on your function and one of the messages didn't process correctly the message will be lost
* If you catch and throw an error, the whole batch will be sent back to the queue including the ones which were processed successfully.  This batch will be retried again multiple times based on the `maxReceiveCount`  configuration if the error is not reolved. This will lead to reprocessing of successful messages multiple times
* if you have configured a Dead letter Queue configured with your SQS Queue 