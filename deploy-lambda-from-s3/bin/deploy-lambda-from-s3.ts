#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployLambdaFromS3Stack } from "../lib/deploy-lambda-from-s3-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const bucketArn = app.node.getContext("bucketArn");
const objectKey = app.node.getContext("objectKey");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
new DeployLambdaFromS3Stack(app, "DeployLambdaFromS3Stack", {
  stackName: `lambdaFromS3-${scope}`,
  scope: scope,
  bucketArn,
  objectKey,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
