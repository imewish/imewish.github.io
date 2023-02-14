---
layout: posts
title: Running AWS Lambda Functions Every 10 Seconds
permalink: running-aws-lambda-every-10-seconds
date: '2023-02-12T18:30:00.000Z'
image_upload: /uploads/pexels-bich-tran-760710.jpg
---


Recently I had a requirement at work to run a cron job every 10 sec or 30 sec to poll some third-party API to pull some data. There will be more than 40 of these cron parallelly to fetch different sets of data from different APIs. The first obvious option would come to a serverless first mindset which I have is to run these on lambda functions.

The only native way in AWS to run the Lambda function is to have an Event bridge trigger with Cron expressions. The problem with this is event bridge only supports cron jobs as low as 1 minute. So for my use case, I cannot use Eventbridge. &#x20;

Another way to achieve this could be running the cron inside an ECS/Fargate container using any nodejs framework and some cron NPM module. The problem with this can be debugging and troubleshooting each cron and restarting them if fails etc. I didn't want to get into that.&#x20;

So how can we solve this in the proper serverless way?&#x20;

After googling around different solutions people tried to achieve this with step functions and SQS etc. I decided to build something with AWS StepFunctions. The main reason to choose this is it can be a low-code solution, actually 0 code. The only thing we would need is the IaC code to build the step function.&#x20;

#### **The Solution**

![serverless-lambda-run-x-seconds](</uploads/Screenshot 2023-02-13 at 10.06.29 PM.png> "serverless-lambda-run-x-seconds")

##### ** How it works**

The above particular will be triggered by the event bridge every minute and will pass an input {counter: 0}

1. The first state in the above state machine(Pass state), at this stage we will transform the input by adding 1 to the input of the state. Using step-functions intrinsic function MathAdd in this case.
2. The next state is a choice state, where we check the value of the counter ,&#x20; If the value of the counter is less than 6, the choice state goes to next state and trigger a lambda function(function which need to be run every 10 sec)

3. Once lambda function triggered it enters a wait state. where it waits for 10 sec(period we want to trigger lambda). 

4. After the wait state it goes back to the start state and continue processing. On the first Pass state it keeps incrementing the counter. 

5. The choice state will check the counter every time and if the vaule of the counter is equal to 6, which is 10 * 6 (1 minute), it goes to the last pass state and ends the stepfunction process. 
