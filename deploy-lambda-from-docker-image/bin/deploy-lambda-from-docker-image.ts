#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployLambdaFromDockerImageStack } from "../lib/deploy-lambda-from-docker-image-stack";

const app = new cdk.App();
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
const scope = app.node.getContext("scope");
new DeployLambdaFromDockerImageStack(app, "DeployLambdaFromDockerImageStack", {
  stackName: `lambdaFromDockerImage-${scope}`,
  scope: scope,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
