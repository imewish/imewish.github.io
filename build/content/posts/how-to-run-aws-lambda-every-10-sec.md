+++
date = 2023-02-18T18:30:00Z
image_upload = ""
layout = "post"
permalink = "running-aws-lambda-every-10-seconds"
tags = ["serverless", "cronjob", "lambda", "aws"]
title = "How to Run AWS Lambda every 10 sec"

+++
Recently I had a requirement at work to run a cron job every 10 sec or 30 sec to poll some third-party API to pull some data. There will be more than 40 of these cron parallelly to fetch different sets of data from different APIs. The first obvious option would come to a serverless first mindset which I have is to run these on lambda functions.

The only native way in AWS to run the Lambda function is to have an Event bridge trigger with Cron expressions. The problem with this is event bridge only supports cron jobs as low as 1 minute. So for my use case, I cannot use Eventbridge.

So how can we solve this in the proper serverless way?

After googling around different solutions people tried to achieve this with step functions and SQS etc. I decided to build something with AWS StepFunctions. The main reason to choose this is it can be a low-code solution, actually 0 code. The only thing we would need is the IaC code to build the step function.

#### **The Solution**

![step-function-defenition](/uploads/screenshot-2023-02-19-at-11-55-17-am.png "step-function-defenition")

#### **How it works**

The above state-machine will be triggered by the event bridge every minute and will pass an input {counter: 0}

1\. The first state in the above state machine(Pass state), at this stage we will transform the input by adding 1 to the input of the state. Using step-functions intrinsic function MathAdd in this case.

2\. The next stage is a choice state, where we check the value of the counter, If the value of the counter is less than 6, the choice state goes to the next state and triggers a lambda function(a function that needs to be run every 10 sec)

3\. Once the lambda function is triggered it enters a wait state. where it waits for 10 sec(the period we want to trigger lambda).

4\. After the wait state it goes back to the start state and continues processing. On the first Pass state, it keeps incrementing the counter.

5\. The choice state will check the counter every time and if the value of the counter is equal to 6, which is 10 * 6 (1 minute), it goes to the last pass state and ends the step-function process.

Since I have to run 40+ lambda to run every 10 sec I could have to add those 40 in a parallel step in the step functions. But I decided to have a single function in the state machine, which will be responsible to trigger all the other lambdas using AWS SDK asynchronously.  The main reason for choosing this way is to disable or enable a single cron by keeping a list of functions on persistent storage/ env vars in case of downtime in the third-party API failures which functions rely on to get data.

Since the state machine is triggered using an event bridge rule, we can enable or disable all the crons in case of an emergency ( As a kill switch).

The source code for the above solution can be found [here](https://gist.github.com/imewish/7924bc329c29d5a8c5f4dd6e58aad696 "state machine code").

**Conclusion**

The above solution is built for the very specific use case I had. So it may or may not work for all.