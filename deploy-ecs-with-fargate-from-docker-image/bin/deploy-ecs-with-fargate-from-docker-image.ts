#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployEcsWithFargateFromDockerImageStack } from "../lib/deploy-ecs-with-fargate-from-docker-image-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");

new DeployEcsWithFargateFromDockerImageStack(
  app,
  "DeployEcsWithFargateFromDockerImageStack",
  {
    stackName: `ecsWithFargate-${scope}`,
    scope: scope,
    env: {
      account: account || process.env.CDK_DEFAULT_ACCOUNT,
      region: region || process.env.CDK_DEFAULT_REGION,
    },
  },
);
