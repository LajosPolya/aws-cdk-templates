#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployLambdaTriggeredBySqsStack } from "../lib/deploy-lambda-triggered-by-sqs-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
new DeployLambdaTriggeredBySqsStack(app, "DeployLambdaTriggeredBySqsStack", {
  stackName: `lambdaTriggeredBySqs-${scope}`,
  scope,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
