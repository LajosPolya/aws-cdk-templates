#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployStepFunctionWithLambdaStack } from "../lib/deploy-step-function-with-lambda-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
new DeployStepFunctionWithLambdaStack(
  app,
  "DeployStepFunctionWithLambdaStack",
  {
    stackName: `sfWithLambda-${scope}`,
    scope: scope,
    env: {
      account: account || process.env.CDK_DEFAULT_ACCOUNT,
      region: region || process.env.CDK_DEFAULT_REGION,
    },
  },
);
