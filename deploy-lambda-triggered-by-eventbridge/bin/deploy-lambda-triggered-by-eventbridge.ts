#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployLambdaTriggeredByEventbridgeStack } from "../lib/deploy-lambda-triggered-by-eventbridge-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const triggerLambdaCron = app.node.getContext("triggerLambdaCron");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
new DeployLambdaTriggeredByEventbridgeStack(
  app,
  "DeployLambdaTriggeredByEventbridgeStack",
  {
    stackName: `lambdaTriggeredByEventBridge-${scope}`,
    scope: scope,
    triggerLambdaCron,
    env: {
      account: account || process.env.CDK_DEFAULT_ACCOUNT,
      region: region || process.env.CDK_DEFAULT_REGION,
    },
  },
);
