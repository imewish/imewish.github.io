+++
date = 2021-08-17T18:30:00Z
draft = true
image_upload = ""
layout = "post"
permalink = "aws-cloud-watch-custom-metrics-howto"
tags = ["cloud", "aws", "custommetrics", "metrics", "clodwatch", "serverless"]
title = "Cloudwatch Custom Metrics And How To Generate Them Asynchronously"

+++
#### Introduction

Cloudwatch is an integral part of the AWS ecosystem. Every service in AWS reports to cloudwatch for the service logs,  application logs, metrics, etc.

In this article let's discuss cloudwatch metrics, and their custom metrics feature in detail.

Metrics help us with finding the performance of the AWS services and the applications we run using these services. It also allows us to visualize the data with graphs and dashboards and create alarms based on the data reported tho metrics. If you are new to cloudwatch and cloudwatch metrics you can learn the basic concepts [here](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html "Cloudwatch Concepts")

#### Custom Metrics

By default, AWS provides free metrics for most of its services. Apart from its own service metrics, AWS allows us to publish custom metrics, which means you can send your application-specific metrics to cloudwatch metrics. for eg, you can push the metrics for the duration of third-party api calls, or the count of status codes returned by an API, then you can create [alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html "Cloudwatch Alarms"), dashboards based on those metrics.

Now let's see how we can create custom metrics and put data points to them, There are three ways of creating custom cloudwatch metrics from your application.

* AWS API's/SDK for cloudwatch metric
* Metric Log Filters
* Cloudwatch Embedded Metric Format

_Let's see how we can create Custom metrics with the above three methods. For the demo purpose, let's assume we have an AWS lambda function that calls a weather API, and we want to create metrics around the API call duration and the count of status codes returned by the API endpoint._

1. **Using** [**AWS API's/SDK's**](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudWatch.html "Cloudwatch SDK")

   This method uses the AWS cloudwatch metrics SDK's [putMetricData ](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudWatch.html#putMetricData-property) API to create the custom metrics. This method is pretty straightforward, but the problem with this method is that it will incur an additional API call and it can block other API calls in your application while putting metrics to cloudwatch. This could affect the latency of your application (for eg: REST APIs).  Also, each **putMetricData** api call involves cost. AWS will charge $0.01 per 1000 requests.

   **Example**

       'use strict';
       
       const axios = require('axios')
       const AWS = require('aws-sdk')
       var cloudwatch = new AWS.CloudWatch();
       
       
       module.exports.handler = async (event) => {
         try {
          
           const startTime = new Date()
           const response = await axios.get('https://www.metaweather.com/api/location/2487956/2021/8/8')
           const apiStatusCode = response.status
           const endTime = new Date()
       
           console.log(apiStatusCode)
       
           const apiCallDuration = endTime - startTime
           
           var statusMetricParams = {
               MetricData: [ 
                 {
                   MetricName: 'status_code', 
                   Dimensions: [
                     {
                       Name: 'status_code', 
                       Value: `http_${apiStatusCode}` 
                     },
                   ],
                   Timestamp: new Date(),
                   Unit: 'Count',
                   Value: 1,
                 }
               ],
               Namespace: 'MetricFromSDK_1' 
           };
             
           await cloudwatch.putMetricData(statusMetricParams).promise();
           
           var durationMetricParams = {
               MetricData: [ 
                   {
                       MetricName: 'api_call_duration', 
                       Dimensions: [
                           {
                           Name: 'api_name', 
                           Value: `location_api` 
                           },
                       ],
                       Timestamp: new Date(),
                       Unit: 'Milliseconds',
                       Value: apiCallDuration,
                   }
               ],
               Namespace: 'MetricFromSDK_1' 
           };
             
           await cloudwatch.putMetricData(durationMetricParams).promise();
       
         } catch (error) {
           console.log('failed',error)
         }
       };
2. **Using Metric Log Filters**

   Metric log filters can search and filter data points needed to create metrics from Cloudwatch log groups. CloudWatch Logs uses these metric filters to turn log data into numerical CloudWatch metrics that you can graph or set an alarm on. When you create a metric from a log filter, you can also choose to assign dimensions and a unit to the metric. If you specify a unit, be sure to specify the correct one when you create the filter. Changing the unit for the filter later will have no effect.

   With this method, the metrics are generated asynchronously. You don't need any additional API calls from the application to generate the metrics. You just need to log the metrics data in a JSON format in the application and create a metric filter for each metric on the applications cloudwatch log group which filters the metric data from the logs based on the filter expressions defined.

   The only downside I see with this method is the creation of metric filters on log groups every time you need to create a new metric. You can create them manually or use any IaC tool to generate them on demand.

   **Example:**

       'use strict';
       
       const axios = require('axios')
       
       module.exports.handler = async (event) => {
         try {
          
           const startTime = new Date()
           const response = await axios.get('https://www.metaweather.com/api/location/2487956/2021/8/8')
           const apiStatusCode = response.status
           const endTime = new Date()
       
           const apiCallDuration = endTime - startTime
           
           console.log({ metricName: 'api_call_duration', metricValue: apiCallDuration })
           console.log({ metricName: 'status_code_count', metricValue: apiStatusCode})
       
           console.log({[`http_${apiStatusCode}`]: 1})
       
         } catch (error) {
           console.log(error)
         }
       };
       

![](/static/uploads/screenshot-2021-08-26-at-7-12-02-am.png)

![](/static/uploads/screenshot-2021-08-26-at-7-12-52-am.png)

![](/static/uploads/screenshot-2021-08-26-at-7-14-02-am.png)

![](/static/uploads/screenshot-2021-08-26-at-7-14-37-am.png)

1. **Cloudwatch Embedded Metric Format**

   The CloudWatch embedded metric format is a JSON specification used to instruct CloudWatch Logs to automatically extract metric values embedded in structured log events. You can use CloudWatch to graph and create alarms on the extracted metric values.

   With embedded metric format you can create custom metrics asynchronously from your applications, which means you don't have to create additional API calls from your applications to generate the metrics, also you don't have to create metric filters on each log group. All you have to do is log your metrics to cloudwatch in a specific JSON format as documented [here](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html). AWS will automatically parse these logs from cloudwatch log groups and generate the metrics for you.