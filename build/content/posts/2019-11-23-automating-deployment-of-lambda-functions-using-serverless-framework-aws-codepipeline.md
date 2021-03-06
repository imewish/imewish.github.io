---
tags:
- CI/CD
- serverless
- aws
layout: post
title: Automating Deployment Of Lambda Functions Using Serverless Framework, AWS CodePipeline
permalink: lambda-sls-codepipeline-deploy
date: 2020-01-01
---
*In this guide we will set up a very simple REST API endpoint with the serverless framework, AWS Lambda, and API Gateway and deploy it to AWS Lambda with Github, AWS Codepipeline, Codebuild*



## 1. Install the Serverless Framework

```
npm install serverless -g
```

## 2. Create a project

```
serverless create --template aws-nodejs --path serverless-nodejs-api
```
This will create two files `handler.js` and `serveless.yml`

```
'use strict';

module.exports.api = async event => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0! Your function executed successfully!'
      },
      null,
      2
    ),
  };
};
```

Update your serverless.yml to add an API Gateway endpoint.

```
service: serverless-nodejs-api

provider:
  name: aws
  runtime: nodejs10.x
  stage: dev

functions:
  getMsg:
    handler: handler.api
    events:
      - http: GET /
```

Now we have our serverless API code ready. 

You can deploy this to AWS manually by running `sls deploy --stage dev`

This will deploy the lambda function and create an API gateway endpoint for the function. 

Once deployed, the output will print the newly created API gateway endpoint. test the function by calling the API endpoint. Something like this,

```
Service Information
service: serverless-nodejs-api
stage: dev
region: us-east-1
stack: serverless-nodejs-api-dev
resources: 9
api keys:
  None
endpoints:
  GET - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev
functions:
  api: serverless-nodejs-api-dev-getMsg
layers:
  None
```

test the function by calling the API endpoint. 

```
curl https://xxxxx.execute-api.us-east-1.amazonaws.com/dev

{
  "message": "Go Serverless v1.0! Your function executed successfully!"
}
```

***Now let's automate the deployment process with Github, AWS Codepipeline***

Let's consider this code as production-ready and push the code to the GitHub repo master branch.

*PS: We can create multiple pipelines per brach for eg: Master -> Prod, Development -> Staging/Dev Environment*


## 3. Setup Codepipeline 

#### 3.1 Set Pipeline name and Create IAM Role
# ![](https://i.imgur.com/0G7LGP6.jpg)

#### 3.2 Add source stage

In this stage, Connect to your Github account and choose your repo and branch
Set the detection method  

![](https://i.imgur.com/d5R9UOA.jpg)

#### 3.3 Add build stage

In this step, we have to create a Codebuild project, where we configure our build and deploy environment and commands.

Click on the **Create Project** button, it will take you to the Codebuild setup page.


![](https://i.imgur.com/881kqAW.jpg)

*Set the project name here*

![](https://i.imgur.com/DalIjHD.jpg)

*Choose your runtime and image for the build environment*

*Choose an IAM role for the project* - **This part is important**

**This role must have enough permissions for the serverless framework to deploy the function and its resources to AWS as follows,** 

* Create an S3 bucket for your function deployments
* Upload your function zip files to that S3 bucket
* Submit a CloudFormation template
* Create the log groups for your Lambda functions
* Create a REST API in API Gateway

*You can use the below awesome NPM modules to create a narrow IAM policy template that will cover many Serverless use cases.* 

`npm install -g yo generator-serverless-policy`

then on your serverless app directory 

```
$ yo serverless-policy
? Your Serverless service name test-service
? You can specify a specific stage, if you like: dev
? You can specify a specific region, if you like: us-west-1
? Does your service rely on DynamoDB? Yes
? Is your service going to be using S3 buckets? Yes
app name test-service
app stage dev
app region us-west-1
Writing to test-service-dev-us-west-1-policy.json
```

***After you finish creating the codebuild project go to its IAM role and append the policy with the rules created by the above template.*** 

You can find the IAM policy we used for this guide here,
https://github.com/imewish/serverless-nodejs-api/blob/master/codebuild-IAM-policy.json

![](https://i.imgur.com/RKn6C9O.jpg)
![](https://i.imgur.com/tfJdYRF.jpg)


*Define Build Spec.*

You can find it here. https://github.com/imewish/serverless-nodejs-api/blob/master/buildspec.yml
> Here we will define the commands to set up the serverless framework and deploy commands to AWS.
> 
> On install phase
> * Set nodejs 10 as runtime
> * Install serverless framework
> On Build Phase
> 
> * Install npm packages
> * Deploy to lambda with `sls deploy --stage dev/prod`
> 

NB: You can also run your tests here if you have test cases written for your lambda functions.

![](https://i.imgur.com/hORjMoL.jpg)

![](https://i.imgur.com/FrOlrri.jpg)

Enable Cloudwatch logs so that we can tail our build process logs.

Then click on **Continue to Codepipeline** this will take us back to Codepipeline Setup.

#### 4. Deploy Stage 

This stage is optional. 

Since the serverless framework already put the deployment artifacts to an S3 bucket we can skip this part. But if you want to store it to a different bucket you can set up like this. 

![](https://i.imgur.com/2qmHBAX.jpg)


Click Next and then review all the setup then Create the pipeline. 

That's it!. Now you can test this by going to the newly created pipeline and click on ***Release Change***

![](https://i.imgur.com/lQW9adE.jpg)
![](https://i.imgur.com/8rE0W6o.jpg)

