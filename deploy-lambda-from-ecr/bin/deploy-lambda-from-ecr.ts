#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployLambdaFromEcrStack } from "../lib/deploy-lambda-from-ecr-stack";
import { DeployEcrStack } from "../lib/deploy-ecr-stack";

const app = new cdk.App();

const repoName = app.node.getContext("repoName");
const imageTag = app.node.getContext("tag");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
const scope = app.node.getContext("scope");

const ecrStack = new DeployEcrStack(app, "DeployEcrStack", {
  stackName: `ecr-${repoName}`,
  repoName,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});

new DeployLambdaFromEcrStack(app, "DeployLambdaFromEcrStack", {
  stackName: `lambdaFromEcr-${scope}`,
  scope,
  ecr: ecrStack.ecr,
  tag: imageTag,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});

app.synth();
