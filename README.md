# aws-cdk-templates

The goal of this project is to create templates to deploy AWS infrastructure using AWS CDK. This project has two main types of deployments; the `api`, and the directories with the name `deploy-*`. The [api](api) directory describes how to build a docker image out of a simple [Micronaut](https://micronaut.io/) application. While the `deploy-*` directories describe how to deploy AWS infrastructure. Each directory has its own README describing the deployment process.

One of the major benefits of deploying AWS infrastructure using AWS CDK is that the infrastructure can be deployed and destroyed programmatically. This allows for quick and easy cleanup as well as rapid prototyping.
