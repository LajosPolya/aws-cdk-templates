# aws-cdk-templates :rocket:

The goal of this project is to create templates to deploy AWS infrastructure using AWS CDK in TypeScript. This project has three main types of directories;

1. `deploy-*` directories deploy AWS infrastructure. Each directory has its own README describing the deployment process.
2. The [api](api) directory describes how to build a docker image out of a simple [Micronaut](https://micronaut.io/) application.
3. `lambda-handler*` directories contain Lambda handlers referenced by some of the deployers.

One of the major benefits of deploying AWS infrastructure using AWS CDK is that the infrastructure can be deployed and destroyed programmatically and every deployment is identical. This allows for quick and easy cleanup as well as rapid prototyping.

These deployment examples are meant to be used as an opportunity to learn about AWS infrastructure and should not be used in production environments.

The deployment of some of these CDK stacks cost money! To reduce costs, always destroy the deployment when it is no longer in use!

## Installing the AWS CDK :hammer_and_wrench:

`npm install -g aws-cdk`

After installing the CDK, install the [AWS CLI](https://aws.amazon.com/cli/) and [bootstrap](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) the CDK to your AWS environment.

## A note on Windows :paperclip:

### Git Bash

If using Windows it is reccomended to run `cdk` commands using the Git Bash command line, Git Bash should be included with Git. Since Git Bash doesn't support TTY all `cdk` commands must be prefixed with [winpty](https://github.com/rprichard/winpty), for example, instead of executing `cdk deploy`, execute `winpty cdk.cmd deploy` (NodeJS must be on `PATH` for this to work).

### 7 Zip

The Lambda handlers' build process needs a compression library to zip the distribution files, but since Windows doesn't ship with a command line compression library, [7 Zip](https://www.7-zip.org/) must be installed to compress the distribution files.

## Where to begin

... Add simple and complex examples ...