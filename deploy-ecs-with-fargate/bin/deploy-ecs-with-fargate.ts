#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployEcsWithFargateStack } from "../lib/deploy-ecs-with-fargate-stack";

const app = new cdk.App();

const ecrName = app.node.getContext("ecrName");
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");

new DeployEcsWithFargateStack(app, "DeployEcsWithFargateStack", {
  stackName: `deploy-ecr-${scope}`,
  ecrName,
  scope,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
