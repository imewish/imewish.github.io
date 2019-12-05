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
Hosting a static website with S3 is awesome! It is Faster, Cheaper, zero maintenance.

In this article, we will see how to do URL redirects on a website hosted with AWS S3 and Cloudfront.

There was a scenario which I was faced once in my company, One of our websites had deleted some old content and replaced it with new content and URL. And when people who google search for that particular content they get the old URL which doest exists. 

To fix this issue the approach we had was to do add a temporary redirect for that old URL to the new one until it gets updated at google search.

 