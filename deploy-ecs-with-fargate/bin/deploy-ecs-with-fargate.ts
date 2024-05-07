#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployEcsWithFargateStack } from "../lib/deploy-ecs-with-fargate-stack";
import { DeployEcrStack } from "../lib/deploy-ecr-stack";

const app = new cdk.App();

const imageTag = app.node.getContext("tag");
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");

const ecrStack = new DeployEcrStack(app, "DeployEcrStack", {
  stackName: `ecsEcr-${scope}`,
  scope: scope,
  imageTag: imageTag,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});

new DeployEcsWithFargateStack(app, "DeployEcsWithFargateStack", {
  stackName: `ecsFargate-${scope}`,
  repo: ecrStack.repository,
  imageTag: imageTag,
  scope: scope,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
