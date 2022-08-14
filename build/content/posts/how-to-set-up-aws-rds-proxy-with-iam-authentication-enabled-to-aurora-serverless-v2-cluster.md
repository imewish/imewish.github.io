+++
date = 2022-08-12T18:30:00Z
image_upload = ""
layout = "posts"
permalink = "aws-rds-proxy-iam-authentication-aurora-serverless"
tags = ["aurora", "serverless", "iamauth", "postgres", "database", "rdsproxy", "rds", "aws"]
title = "How to set up AWS RDS Proxy with IAM Authentication enabled to Aurora Serverless V2 Cluster"

+++
## What is RDS Proxy

Many applications, including those built on modern serverless architectures, can have many open connections to the database server and may open and close database connections at a high rate, exhausting database memory and compute resources. Amazon RDS Proxy allows applications to pool and share connections established with the database, improving database efficiency and application scalability. With RDS Proxy, failover times for Aurora and RDS databases are reduced by up to 66%, and database credentials, authentication, and access can be managed through integration with AWS Secrets Manager and AWS Identity and Access Management (IAM).

In this article, we will see how we can set up an RDS Proxy with IAM authentication enabled and connect to an Aurora Serverless V2 Cluster.

All the IaC for this tutorial is written in Terraform. You can use your own choice of IaC.

_Note: RDS proxy cannot be used with Aurora Serverless V1 Cluster. Use_ [_RDS Data API_](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html) _instead_

### 1. Setup RDS AuroraV2 Cluster

**RDS Cluster Security Group**

Make sure the RDS Cluster Security group will accept the traffic from the RDS Proxy Security group.

You can also use the same security group for the RDS cluster and RDS Proxy. In this case, the security group should accept traffic from itself. With terraform, we should add `self = true` in the ingress rule. In this session, we are using different security groups for **Cluster** and **Proxy**.

    resource "aws_security_group" "rds_cluster" {
      name        = "rds-postgres-cluster"
      description = "Allow Postgres traffic to rds"
      vpc_id      = data.aws_ssm_parameter.vpc_id.value
    
      ingress {
        description     = "TLS from VPC"
        from_port       = 5432
        to_port         = 5432
        protocol        = "tcp"
        cidr_blocks     = [data.aws_ssm_parameter.vpc_cidr.value]
        security_groups = [aws_security_group.rds_proxy.id]
        // Cluster should accept traffic from RDS proxy Security group
      }
    
      egress {
        from_port        = 0
        to_port          = 0
        protocol         = "-1"
        cidr_blocks      = ["0.0.0.0/0"]
        ipv6_cidr_blocks = ["::/0"]
      }
    }

**RDS Cluster**

This will create an RDS Aurora V2 Postgress Cluster.

* Make sure IAM authentication is enabled

      resource "aws_rds_cluster" "demo" {
        cluster_identifier                  = "${var.service}-${var.stage}-demo"
        database_name                       = "demo"
        master_username                     = "hyatt_main"
        master_password                     = random_password.rds_demo.result
        engine                              = "aurora-postgresql"
        engine_mode                         = "provisioned"
        engine_version                      = "13.6"
        storage_encrypted                   = true
        kms_key_id                          = module.main_kms.alias_target_key_arn
        vpc_security_group_ids              = [aws_security_group.rds_cluster.id]
        db_subnet_group_name                = aws_db_subnet_group.cortex_back.id
        availability_zones                  = ["us-east-2a", "us-east-2b", "us-east-2c"]
        iam_database_authentication_enabled = true
      
      serverlessv2_scaling_configuration {
          max_capacity = 2.0
          min_capacity = 1.0
        }
      }
      
      #RDS Cluster Instance
      
      resource "aws_rds_cluster_instance" "demo" {
        identifier          = "${var.stage}-demo-1"
        cluster_identifier  = aws_rds_cluster.demo.id
        instance_class      = "db.serverless"
        engine              = aws_rds_cluster.demo.engine
        engine_version      = aws_rds_cluster.demo.engine_version
        publicly_accessible = false
      
      }

**Create Secret**

Store the DB credentials and endpoint details on AWS Secret Manager. This secret will be accessed by the RDS proxy to connect to the RDS cluster

    resource "aws_secretsmanager_secret_version" "rds_credentials" {
      secret_id     = aws_secretsmanager_secret.rds_credentials.id
      secret_string = <<EOF
    {
      "username": "${aws_rds_cluster.demo.master_username}",
      "password": "${random_password.rds_demo.result}",
      "engine": "postgres",
      "host": "${aws_rds_cluster.demo.endpoint}",
      "port": ${aws_rds_cluster.demo.port},
      "dbClusterIdentifier": "${aws_rds_cluster.demo.cluster_identifier}"
    }
    EOF
    }

### 2. Setup RDS Proxy

**Create an IAM Role**

Create an IAM role for the RDS proxy, with permissions to access the secret from the secret manager that we created in the previous step. So the proxy can get the details to connect to the cluster.

    resource "aws_iam_role" "rds_proxy_secrets_access" {
      name = "rds_proxy_secrets_access"
    
      assume_role_policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
          {
            Action = "sts:AssumeRole"
            Effect = "Allow"
            Sid    = ""
            Principal = {
              Service = "rds.amazonaws.com"
            }
          },
        ]
      })
    
      inline_policy {
        name = "my_inline_policy"
    
        policy = jsonencode({
          Version = "2012-10-17"
          Statement = [
            {
              Action   = ["secretsmanager:GetSecretValue"]
              Effect   = "Allow"
              Resource = "${aws_secretsmanager_secret.rds_credentials.arn}"
            },
            {
              Action   = ["kms:Decrypt"]
              Effect   = "Allow"
              Resource = "*"
              Condition = {
                StringEquals = {
                  "kms:ViaService" = "secretsmanager.us-east-2.amazonaws.com"
                }
              }
            },
          ]
        })
      }
    }

**Security Group for RDS Proxy**

This security group will allow traffic from clients like AWS Lambda Functions, Containers, EC2, etc to the RDS proxy. The egress rule will also allow the RDS proxy to talk to the Secrets Manager.

    # RDS Proxy Security Group
    
    resource "aws_security_group" "rds_proxy" {
      name        = "rds-postgres-proxy-sg"
      description = "Allow Postgres traffic to rds from proxy"
      vpc_id      = data.aws_ssm_parameter.vpc_id.value
    
      ingress {
        description = "TLS from VPC"
        from_port   = 5432
        to_port     = 5432
        protocol    = "tcp"
        cidr_blocks = [data.aws_ssm_parameter.vpc_cidr.value]
      }
      egress {
        from_port        = 0
        to_port          = 0
        protocol         = "-1"
        cidr_blocks      = ["0.0.0.0/0"]
        ipv6_cidr_blocks = ["::/0"]
      }
    }

**Create RDS Proxy**

    # RDS Proxy
    
    resource "aws_db_proxy" "demo" {
      name                   = "demo"
      debug_logging          = true
      engine_family          = "POSTGRESQL"
      idle_client_timeout    = 1800
      require_tls            = true
      role_arn               = aws_iam_role.rds_proxy_secrets_access.arn
      vpc_security_group_ids = [aws_security_group.rds_proxy.id]
      vpc_subnet_ids         = [data.aws_ssm_parameter.private_subneta.value, data.aws_ssm_parameter.private_subnetb.value, data.aws_ssm_parameter.private_subnetc.value]
    
      auth {
        auth_scheme = "SECRETS"
        description = "example"
        iam_auth    = "REQUIRED"
        secret_arn  = aws_secretsmanager_secret.rds_credentials.arn
      }
    
      tags = {
        Name = "Name"
        Key  = "demo"
      }
    }
    
    # RDS Proxy Target Group
    
    resource "aws_db_proxy_default_target_group" "demo" {
      db_proxy_name = aws_db_proxy.demo.name
    
      connection_pool_config {
        connection_borrow_timeout    = 120
        max_connections_percent      = 100
        max_idle_connections_percent = 50
      }
    }
    
    # RDS Proxy Target
    
    resource "aws_db_proxy_target" "demo" {
      db_instance_identifier = aws_rds_cluster_instance.demo.id
      db_proxy_name          = aws_db_proxy.demo.name
      target_group_name      = aws_db_proxy_default_target_group.demo.name
    }

Now we have an RDS cluster and Proxy setup. The next step is to write a lambda function to connect to the cluster.

### 3. Lambda Function

This Lambda will use IAM authentication to connect to the RDS proxy, and the proxy will manage the connection to the cluster.

* This function needs to be in the same VPC and subnets that the RDS proxy and Cluster are in.
* And also should have a security group that can talk to the RDS proxy. You could also use the same security group of RDS proxy.

      // rds.ts
      
      import { Signer } from '@aws-sdk/rds-signer';
      import { Client } from 'pg';
      
      // Get an IAM token, This will be used as a password to connect to RDS Proxy
      
      const signer = new Signer({
          hostname: 'Your RDS Proxy Endpoint',
          port: 5432,
          username: 'RDS Cluster Username',
          region: 'us-east-2',
        });
      
      const token = await signer.getAuthToken();
      
      const client = new Client({
            user: 'RDS Cluster Username',
            host: 'Your RDS Proxy Endpoint',
            database: 'DB name',
            password: token, // IAM token
            port: 5432,
            ssl: true,
          });
      
      await client.connect();
          await client.query(select * from 'your table name');

Ensure that Lambda execution role includes **rds-db:connect** permissions as follows.

    {
       "Version": "2012-10-17",
       "Statement": [
          {
             "Effect": "Allow",
             "Action": [
                 "rds-db:connect"
             ],
             "Resource": [
                 "arn:aws:rds-db:region:awsaccountnumber:dbuser:{proxyIdentifier from your rds proxy arn}/*"
             ]
          }
       ]
    }

### **Conclusion**

With the above steps, you should be able to set up an RDS Cluster, RDS Proxy which can connect to the cluster, then a Lambda function that can connect to RDS Proxy via IAM authentication. If you face any issues while connecting to the Proxy, follow the troubleshooting guide below.

### Troubleshooting

Steps to double check if you run to issue while connecting to the Proxy.

1. **Security Groups**:
   * Check RDS proxy security group can access RDS Cluster. If you are using the same security group for both proxy and cluster, ensure the security group has the rule to access itself.
   * RDS proxy security group outbound rule should be able to call Secrets Manager
2. **IAM Role**
   * Make sure the IAM role used in RDS Proxy has correct access roles to call Secrets Manager to get RDS cluster credentials
3. **Client Code**
   * Make sure to use the RDS Proxy endpoint as hostname on both RDS Signer and DB Client.
   * Enable SSL on DB Client
4. **Debug Logs**
   * Enable debug logs on the Proxy. This would add debug logs to cloudwatch, which can give insights into what is causing the problem.

### Useful Resources

1. [https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/rds-proxy.html](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/rds-proxy.html "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/rds-proxy.html")
2. [https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/rds-proxy.troubleshooting.html](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/rds-proxy.troubleshooting.html "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/rds-proxy.troubleshooting.html")