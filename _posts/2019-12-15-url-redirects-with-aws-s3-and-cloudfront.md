---
tags:
- aws
- serverless
- s3
layout: post
title: URL redirects with AWS S3 and Cloudfront
permalink: url-redirect-aws-s3-cloudfront
featured: true
image: assets/images/301.png

---
Hosting a static website with S3 is awesome! It is Faster, Cheaper, Zero maintenance.

In this article, we will see how to do URL redirects on a website hosted with AWS S3 and Cloudfront.

There was a scenario which I was faced once in my company, One of our websites had deleted some old content and replaced it with new content and URL. And when people who google search for that particular content they get the old URL which doest exists.

To fix this issue the approach we had was to do add a temporary redirect for that old URL to the new one until it gets updated at google search.

**The Fix**

AWS S3 Static hosting provides an option to add redirection rules to the website hosted in a particular bucket. [https://docs.aws.amazon.com/AmazonS3/latest/dev/how-to-page-redirect.html](https://docs.aws.amazon.com/AmazonS3/latest/dev/how-to-page-redirect.html "https://docs.aws.amazon.com/AmazonS3/latest/dev/how-to-page-redirect.html")

![](/assets/images/staticwebsitehosting30.png)

In this particular case, the URL's we are going to use will be these,

**_https://example.com/content/old-content_**

and we will be redirecting this to

**_https://example.com/content/new/content_**

To add the rules,

1. Click on your bucket
2. Go to properties and click on static website hosting
3. Under the redirection rules filed, put the following code

Please note, the **_<HostName>example.com</HostName>_**  part is important if your S3 website is configured with **Cloudfront.** Else during redirect, the domain name will be replaced with the S3 website endpoint. 

That's it. Now any requests coming to the old URL will be automatically redirected to the new one 

    {
      "apps": [
        {
          "name": "ether-watcher-node",
          "script": "build/watcher.js",
          "max_restarts": 5,
          "error_file": "logs/ether-watcher-node.stderr.log",
          "out_file": "logs/ether-watcher-node.stdout.log",
          "pid_file": "pids/ether-watcher-node.pid",
          "env": {
            "NODE_ENV": "production"
          }
        },
        {
          "name": "ether-watcher-api",
          "script": "build/index.js",
          "max_restarts": 5,
          "error_file": "logs/ether-watcher-api.stderr.log",
          "out_file": "logs/ether-watcher-api.stdout.log",
          "pid_file": "pids/ether-watcher-api.pid",
          "env": {
            "APP_PORT": 6001,
            "NODE_ENV": "production"
          }
        }
      ]
    }