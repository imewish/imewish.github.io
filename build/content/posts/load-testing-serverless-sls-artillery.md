+++
date = 2020-04-13T18:30:00Z
image = []
layout = "post"
permalink = "load-testing-serverless-applications-with-serverless-artillery"
tags = ["hugo", "aws-lambda", "serverlessartillery", "artillery", "loadtesting", "load testing", "aws", "serverless"]
title = "Load Testing Serverless Applications With Serverless Artillery"
upload_image = ""

+++
Load testing is an important part when you are designing any type of application, whether it is traditional EC2 based or container-based or a complete serverless application.

#### **_Why is Load Testing important?_**

Load testing will help us to find the following

\- How fast is the system

\- How much load can the system handle

\- Under what conditions will the system fail

\- Determine our application’s capabilities by measuring its response time, throughput, CPU utilization, latency, etc. during average and heavy user load. This will eventually help in determining the infrastructure needs as the system scales upward.

\- It gives us an opportunity to find strange behavior or surprises when we subject an application to an insane amount of load (stress testing). Strange behaviors include request timeouts, IO Exceptions, memory leaks, or any security issues.

#### **Choosing a Load testing tool or framework**

There are many great load testing frameworks available. Some of the leading tools are,

\- Jmeter

\- Locust

\- Artillery.io

Each of the above tools provides common and some additional features and different methods of load testing. But the only problem with these tools is the throughput it can generate towards your application is limited to the host systems' memory and CPU capacity. If you want to want to test high and quick traffic ramp-up scenarios it's not possible to do it from your laptop or PC. You can either have a high-end PC or you can run it on a Cloud Virtual Machine, it can be expensive, plus some of the above tools come with a GUI, which cannot be accessed via VM's.

So how can we do load tests **at scale** without having a high-end testing infrastructure?

![](/static/uploads/modern-problems-require-5c6590-1.jpg)

Load Testing Serverless Applications with Serverless Artillery

\---

Serverless artillery is a combination of \[serverless\]([http://serverless.com](http://serverless.com "http://serverless.com")) framework and \[artillery.io\]([https://artillery.io/](https://artillery.io/ "https://artillery.io/")).

**_Combine serverless with artillery and you get serverless-artillery for an instant, cheap, and easy performance testing at scale_**

Serverless-artillery makes it easy to test your services for performance and functionality quickly, easily, and without having to maintain any servers or testing infrastructure.

#### **Use serverless-artillery if**

1\. You want to know if your services (either internal or public) can handle a different amounts of traffic load (i.e. performance or load testing).

2\. You want to test if your services behave as you expect after you deploy new changes (i.e. acceptance testing).

3\. You want to constantly monitor your services over time to make sure the latency of your services is under control (i.e. monitoring mode).

\### **How It Works**

![](/uploads/howitworks-1.jpg)

![](/uploads/architecture-1.gif)

\- Serverless-artillery would be installed and run on your local machine. From command line run slsart --help to see various serverless-artillery commands

\- It takes your JSON or YAML load script \`script.yml\` that specifies,

    - test target/URL/endpoint/service
    
    - load progression
    
    - and the scenarios that are important for your service to test.

\## Let's See It in Action

\*_Load Testing A Sample Application_*

In this example, we will load test a single endpoint(GET) serverless API built with **AWS API Gateway, Lambda, and DynamoDB**

\*_Installing Serverless Artillery on local machine_*

\*_Prerequisite_*

\- NodeJS v8 +

\- Serverless Framework CLI

    npm install -g serverless

**_Installing serverless-artillery_**

    npm install -g serverless-artillery

To check that the installation succeeded, run:

    slsart --version

We can also install it on a \[docker container\]([https://github.com/Nordstrom/serverless-artillery#installing-in-docker](https://github.com/Nordstrom/serverless-artillery#installing-in-docker "https://github.com/Nordstrom/serverless-artillery#installing-in-docker"))

\*_Setting up the Load Test Configuration_*

    mkdir load-test
    
    cd load-test
    
    slsart script // this will create script.yml
    
    config:
      target: "https://xxxxxxx.execute-api.us-east-1.amazonaws.com"
      phases:
        -
          duration: 300
          arrivalRate: 500
          rampTo: 10000
    scenarios:
      -
        flow:
          -
            get:
              url: "/dev/get?id=john"

Understanding \`script.yml\`

**_config_**_:_

The config section defines the target (the hostname or IP address of the system under test),the load progression, and protocol-specific settings such as HTTP response timeouts or \[Socket.io\]([http://socket.io/](http://socket.io/ "http://socket.io/")) transport options

**_target_**:

the URI of the application under test. For an HTTP application, it's the base URL for all requests

**phases**:

specify the duration of the test and the frequency of requests

**scenarios**:

The scenarios section contains definitions for one or more scenarios for the virtual users that Artillery will create.

**flow:**

a "flow" is an array of operations that a virtual user performs, e.g. GET and POST requests for an HTTP-based application

\*_Deploy to AWS_*

    slsart deploy --stage <your-unique-stage-name>

**_Start the load Test_**

    slsart invoke --stage <your-unique-stage-name>

**_The above "script.yml" will try to generate 500 user request/second  towards the API Gateway Endpoint and it will try to ramp up the requests to 10000/RPS in a period of 5 minutes_**

And the result of the test will look like this in a cloud watch dashboard.

![](/uploads/cw-graph.png)

As we can see in the above graph, there are a lot of requests that were throttled by lambda. That is because of lambda's concurrency limit of 1000.

### How Load Testing Helps Serverless Applications

One of the important insights we can get from load testing serverless applications is, It helps to find out the default soft limits or hidden limits of serverless tools. By knowing this we will be able to architecture our application to handle high traffic without throttling the request and hitting the AWS limits.

It also helps to find out the following things,

\- Lambda Insights

    - To find concurrency limits
    
    - To find out the timeouts
    
    - To find out Memory Exceptions
    
    - To find out Cold starts (You can warm up or add provisioned concurrency to those functions)

\- API Gateway

    - To understand the request throttling limits, increase or decrease them according to application needs

\- DynamoDB

    - To get the read write usage metrics and do capacity planning  for handling different level of traffic