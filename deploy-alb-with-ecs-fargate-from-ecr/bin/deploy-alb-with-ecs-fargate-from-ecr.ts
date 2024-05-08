#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployAlbWithEcsFargateFromEcrStack } from "../lib/deploy-alb-with-ecs-fargate-from-ecr-stack";
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
})

new DeployAlbWithEcsFargateFromEcrStack(app, "DeployAlbWithEcsFargateFromEcrStack", {
  stackName: `albWithEcsFargateFromEcr-${scope}`,
  repo: ecrStack.repository,
  imageTag: imageTag,
  scope: scope,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
