+++
date = 2021-02-23T18:30:00Z
image_upload = ""
layout = "post"
permalink = "aws-sqs-partial-failure-handling-lambda"
tags = ["aws", "sqs", "serverless"]
title = "AWS SQS With Lambda, Partial Batch Failure Handling"

+++
Amazon Web Services released SQS triggers for Lambda functions in June 2018. You can use an AWS Lambda function to process messages in an Amazon Simple Queue Service (Amazon SQS) queue. Lambda polls the queue and invokes your Lambda function [synchronously](https://docs.aws.amazon.com/lambda/latest/dg/invocation-sync.html) with an event that contains queue messages. Lambda reads messages in batches and invokes your function once for each batch. When your function successfully processes a batch, Lambda deletes its messages from the queue.

### How Does Lambda Process The Messages?

By default, Lambda invokes your function as soon as records are available in the SQS queue. Lambda will poll up to 10(Can be increased) messages in your queue at once and will send that batch to the function. This means each invocation of lambda will receive up to 10 messages from the Queue to process. Once all messages in the batch are processed lambda will delete the batch from the queue and will start processing the next batch.

### What Happens If One Of The Message In The Batch Failed To Process?

* If you don't throw an error on your function and one of the messages didn't process correctly the message will be lost
* If you catch and throw an error, the whole batch will be sent back to the queue including the ones which were processed successfully.  This batch will be retried again multiple times based on the `maxReceiveCount`  configuration if the error is not resolved. This will lead to reprocessing of successful messages multiple times
* if you have configured a Dead letter Queue configured with your SQS Queue the failed batch will end up there once the  `ReceiveCount` for a message exceeds the `maxReceiveCount` . The successfully processed messaged will also end up in the DLQ. If the consumer of this DLQ has the ability to differentiate between failure and success messages in the batch we are good to go.

### How to Handle The Partial Failure?

1. **Use a batchSize of 1**

   This is useful in low-traffic scenarios. Only one message will be sent to lambda on each invocation. But this limits the throughput of how quickly you are able to process messages
2. **Delete successfully processed messages**

   This is the most effective method to handle this situation.  Process the batch messages inside a `try-catch` block and store the `receiptHandle` for each message in an array and call the `sq.deleteMessage` API and delete those messages when you catch the error and throw an error once you delete the messages that are successfully processed.

       
       'use strict';
       const AWS = require('aws-sdk')
       const sqs = new AWS.SQS();
       
       module.exports.handler = async event => {
         const sqsSuccessMessages = [];
       
         try {
           const records = event.Records ? event.Records : [event];
           for (const record of records) {
             await processMessageFucntion(record)
             // Store successfully processed records 
             sqsSuccessMessages.push(record);
           }
         } catch (e) {
           if (sqsSuccessMessages.length > 0) {
             await deleteSuccessMessages(sqsSuccessMessages);
           }
           throw new Error(e);
         }
       };
       
       // Delete success messages from the queue incase any failure while processing the batch
       // On no failure case lambda will delete the whole batch once processed
       const deleteSuccessMessages = async messages => {
         for (const msg of messages) {
           await sqs
             .deleteMessage({
               QueueUrl: getQueueUrl({
                 sqs,
                 eventSourceARN: msg.eventSourceARN
               }),
               ReceiptHandle: msg.receiptHandle
             })
             .promise();
         }
       };
       
       const getQueueUrl = ({ eventSourceARN, sqs }) => {
         const [, , , , accountId, queueName] = eventSourceARN.split(':');
       
         return `${sqs.endpoint.href}${accountId}/${queueName}`;
       };
       

**Conclusion**

As of now, there is no support for handling partial batch failures in Lambda with SQS. It is totally up to you to decide if you want to handle it or not depends on your application need.

Recently AWS had added support for custom checkpointing for DynamoDB Streams and Kinesis. This means customers now can automatically checkpoint records that have been successfully processed using a new parameter, FunctionResponseType. When customers set this parameter to `Report Batch Item Failure`, if a batch fails to process, only records after the last successful message are retried. This reduces duplicate processing and gives customers more options for failure handling.

This gives hope, that AWS may add something similar for SQS as well🙏