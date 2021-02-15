+++
date = ""
draft = true
image_upload = ""
layout = "post"
permalink = ""
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