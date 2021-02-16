+++
date = 2021-02-14T18:30:00Z
image_upload = ""
layout = "post"
permalink = "decoupling-application-configuration-from-applicationcode-in-your-serverless-application-with-aws-appconfig"
tags = ["aws appconfig", "appconfig", "limits", "aws", "serverless"]
title = "Decoupling Application configuration from application code in your serverless application with AWS Appconfig"

+++
The easiest and most common way of adding application configurations(Eg: feature toggle flags, secrets, fallback URLs, etc) with your serverless applications is by setting them as lambda environment variables. These variables are set to the lambda functions from a configuration file in your code (eg: serverless.yml) or read from secrets manager or parameter store etc and exported during the deployment on your CICD pipeline.

The problem with this approach is, suppose you have a serverless application that has multiple lambda functions under it. These lambda functions are set to do individual tasks. For eg: lambda1 is set to call a third-party payment service, and it reads the API URLs and Keys from lambda environment variables. Now if we want to change the API URL or KEY for this service, would result in a significantly longer and more involved build, test, and deployment process. Each and every time you make a change in the configuration you have to repeat the build, test, deploy process.

**_In this article, we will discuss how to decouple your application configuration from your application code and how to deploy the changes to the service without redeploying the application code base every time there is a change in the configurations. with AWS AppConfig._**

#### What is AppConfig?

AWS AppConfig can be used to create, manage, and quickly deploy application configurations. AppConfig supports controlled deployments to applications of any size and includes built-in validation checks and monitoring. You can use AppConfig with applications hosted on EC2 instances, AWS Lambda, containers, mobile applications, or IoT devices.

AWS AppConfig helps simplify the following tasks:

* **Configure**

  Source your configurations from Amazon Simple Storage Service (Amazon S3), AWS AppConfig hosted configurations, Parameter Store, Systems Manager Document Store. Use AWS CodePipeline integration to source your configurations from Bitbucket Pipelines, GitHub, and AWS CodeCommit.
* **Validate**

  While deploying application configurations, a simple typo could cause an unexpected outage. Prevent errors in production systems using AWS AppConfig validators. AWS AppConfig validators provide a syntactic check using a JSON schema or a semantic check using an AWS Lambda function to ensure that your configurations deploy as intended. Configuration deployments only proceed when the configuration data is valid.
* **Deploy and monitor**

  Define deployment criteria and rate controls to determine how your targets receive the new configuration. Use AWS AppConfig deployment strategies to set deployment velocity, deployment time, and bake time. Monitor each deployment to proactively catch any errors using AWS AppConfig integration with Amazon CloudWatch Events. If AWS AppConfig encounters an error, the system rolls back the deployment to minimize the ct on your application users.

AWS AppConfig can help you in the following use cases:

* **Application tuning** – Introduce changes carefully to your application that can be tested with production traffic.
* **Feature toggle** – Turn on new features that require a timely deployment, such as a product launch or announcement.
* **Allow list** – Allow premium subscribers to access paid content.
* **Operational issues** – Reduce stress on your application when a dependency or other external factor impacts the system.

**DEMO**

The generic way of using app config with your lambda function is to use AppConfig is using AppConfig SDK in the code and call the configuration. The problem with this approach is each and every lambda execution will call the AppConfig API's which will incur additional costs and it might also hit the AppConfig service limits when the traffic is High.

To avoid calling the AppConfig API on each request Amazon has come up with a solution. They have created a [Lambda Extension](https://aws.amazon.com/blogs/compute/introducing-aws-lambda-extensions-in-preview/) for AppConfig.

When the AWS AppConfig extension starts, two main components are created:

The first, the proxy, exposes a localhost HTTP endpoint that can be called from your Lambda code to retrieve a piece of configuration data. The proxy does not call AWS AppConfig directly. Instead, it uses an extension-managed cache that contains the freshest configuration data available. Because the data is already available locally, the HTTP endpoint can be called on every invocation of your function (or even multiple times if you have long-running functions that you want to update mid-flight).

The second component, the retriever, works in the background to keep your configuration data fresh. It checks for potential updates even before your code asks for it. It tracks which configurations your function needs, whether the data is potentially stale, and makes appropriate calls to AWS AppConfig to retrieve fresher data, if available. It ensures the right metadata is passed to avoid any unnecessary data delivery and support various types of rollout strategy.

The determination of “how fresh is fresh” can be configured using Lambda environment variables. These configs changes rarely.

* `AWS_APPCONFIG_EXTENSION_POLL_INTERVAL_SECONDS`, which defaults to 45 seconds, specifies the frequency with which the extension checks for new configuration data.
* `AWS_APPCONFIG_EXTENSION_POLL_TIMEOUT_MILLIS`, which defaults to 3000 milliseconds, specifies the maximum time the extension waits for a piece of configuration data before giving up and trying again during the next poll interval
* `AWS_APPCONFIG_EXTENSION_HTTP_PORT` which defaults to 2772, specifies the port that the proxy’s HTTP endpoint uses

Now, Let's create a simple REST API for the demo.

First, we need to create a new application in AppConfig. For that go to AWS Console → Systems Manager → AppConfig

1. Create an Application

![](/static/uploads/screenshot_2020-11-20_at_8-12-59_am.png)

2. Create an Environment

![](/static/uploads/screenshot_2020-11-20_at_8-13-48_am.png)

3. Create a Configuration Profile and add some configs

![](/static/uploads/screenshot_2020-11-20_at_8-15-11_am.png)

![](/static/uploads/screenshot_2020-11-20_at_8-16-11_am.png)

4\. Deploy the configuration

![](/static/uploads/screenshot_2020-11-20_at_8-28-59_am.png)

![](/static/uploads/screenshot_2020-11-20_at_8-38-20_am.png)

**To the Code**

Considering we have e-commerce API where you want to change the discounts for new customers, the value for discounts is something that can vary often. By Using AppConfig we can update that without any changes and deployments in our application code.

Below is the sample code for our demo App.

`handler.js`

    const http = require('http');
    const axios = require('axios')
    
    exports.demo = async (event) => {
    
      let configData = await axios.get("http://localhost:2772/applications/DemoApp/environments/develop/configurations/generalConfig")
    
      let discountPercentage = configData.data.discountPercentage
      const response = {
        statusCode: 200,
        body: `You have ${discountPercentage}% off on your first purchase`,
      };
      return response;
    };

[http://localhost:2772/applications/DemoApp/environments/develop/configurations/generalConfig](http://localhost:2772/applications/DemoApp/environments/develop/configurations/generalConfig) This URL is the HTTP endpoint for the proxy running on the lambda extension. Our Lambda will call this on every execution to get the latest configurations

`serverless.yml`

    service: appconfig-poc
    
    provider:
      name: aws
      runtime: nodejs12.x
      region: us-west-2
      iamRoleStatements:
        - Effect: 'Allow'
          Action:
            - 'appconfig:GetConfiguration'
          Resource: '*'
      ## These are the lambda extension configurations
      environment:
        AWS_APPCONFIG_EXTENSION_POLL_INTERVAL_SECONDS: 30
        AWS_APPCONFIG_EXTENSION_POLL_TIMEOUT_MILLIS: 3000
        AWS_APPCONFIG_EXTENSION_HTTP_PORT: 2772
      
    
    functions:
      demo:
        handler: handler.demo
        ## AWS AppConfig Lambda Layer
        ## Choose the layer for your region from here https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions.html
        layers:
          - arn:aws:lambda:us-west-2:359756378197:layer:AWS-AppConfig-Extension:18
        events:
          - http:
              path: getDiscount
              method: get

Deploy the code. You will get an http endpoint.

    ➜ sls deploy --stage dev                                                     
    Serverless: Running "serverless" installed locally (in service node_modules)
    Serverless: Packaging service...
    Serverless: Excluding development dependencies...
    Serverless: Uploading CloudFormation file to S3...
    Serverless: Uploading artifacts...
    Serverless: Uploading service appconfig-poc.zip file to S3 (135.58 KB)...
    Serverless: Validating template...
    Serverless: Updating Stack...
    Serverless: Checking Stack update progress...
    ...............
    Serverless: Stack update finished...
    Service Information
    service: appconfig-poc
    stage: dev
    region: us-west-2
    stack: appconfig-poc-dev
    resources: 11
    api keys:
      None
    endpoints:
      GET - https://xxxxxx.execute-api.us-west-2.amazonaws.com/dev/getDiscount
    functions:
      demo: appconfig-poc-dev-demo
    layers:
      None
    Serverless: Removing old service artifacts from S3...

Now once you call the endpoint you will get the message like this.

    ➜ curl https://xxxxxx.execute-api.us-west-2.amazonaws.com/dev/getDiscount
    You have 5% off on your first purchase

Now change the value for `discountPercentage` on AppConfig and deploy.

1. Goto configuration profile and create a new version of the configuration

![](/static/uploads/screenshot_2020-11-20_at_8-51-07_am.png)

![](/static/uploads/screenshot_2020-11-20_at_8-51-30_am.png)

2\. Deploy the new version of the config

![](/static/uploads/screenshot_2020-11-20_at_8-52-00_am-1.png)

Once the deployment is finished hit the endpoint to see the updated discount percentage.

    ➜ curl https://xxxxx.execute-api.us-west-2.amazonaws.com/dev/getDiscount
    You have 10% off on your first purchase

See We have successfully updated our application config without changing/deploying our codebase 🎉

### Conclusion

The demo above is a very simple use case of AWS AppConfig. But there are many other things we can achieve with it. AWS customers are using this for multiple use cases like,

* Feature flags: You can deploy features onto production that are hidden behind a feature flag. Toggling the feature flag turns on the feature immediately, without doing another code deployment.
* Allow lists: You might have some features in your app that are for specific callers only. Using AWS AppConfig, you can control access to those features and dynamically update access rules without another code deployment
* The verbosity of logging: You can control how often an event occurs by setting a variable limit. For example, you can adjust the verbosity of your logging during a production incident to better analyze what is going on. You would want to do another full deployment in the case of a production incident, but a quick configuration change gets you what you need.