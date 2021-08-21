+++
date = 2021-08-17T18:30:00Z
draft = true
image_upload = ""
layout = "post"
permalink = "aws-cloud-watch-custom-metrics-howto"
tags = ["cloud", "aws", "custommetrics", "metrics", "clodwatch", "serverless"]
title = "Cloudwath Custom Metrics And How To Create Them"

+++
Cloudwatch is an integral part of the AWS ecosystem. Every service in AWS reports to cloudwatch for the service logs,  application logs, metrics, etc.

In this article let's discuss cloudwatch metrics, and their custom metrics feature in detail.

Metrics help us with finding the performance of the AWS services and the applications we run using these services. It also allows us to visualize the data with graphs and dashboards and create alarms based on the data reported tho metrics. If you are new to cloudwatch and cloudwatch metrics you can learn the basic concepts [here](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html "Cloudwatch Concepts")

#### **Custom Metrics**

By default, AWS provides free metrics for most of its services. Apart from its own service metrics, AWS allows us to publish custom metrics, which means you can send your application-specific metrics to cloudwatch metrics. for eg, you can push the metrics for the duration of third-party api calls, success or failed count of some particular action or process in the application, then you can create [alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html "Cloudwatch Alarms") based on those metrics.

Now let's see how can create custom metrics,

There are multiple ways of creating custom cloudwatch metrics from your application

1. **Using** [**AWS API's/SDK's**](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudWatch.html "Cloudwatch SDK")

This method uses the AWS cloudwatch metrics SDK's [**putMetricData **](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudWatch.html#putMetricData-property) API to create the custom metrics. This method is pretty straightforward, but the problem with this method is that it will incur an additional API call, in your app and it could affect the latency of your application (Incase of APIs).  Also, each **putMetricData** api call involves cost. AWS will charge $0.01 per 1000 requests.

2. **Metric Log Filters**