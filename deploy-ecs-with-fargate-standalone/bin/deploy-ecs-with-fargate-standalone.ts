#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { DeployEcsWithFargateStandaloneStack } from "../lib/deploy-ecs-with-fargate-standalone-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");

new DeployEcsWithFargateStandaloneStack(
  app,
  "DeployEcsWithFargateStandaloneStack",
  {
    stackName: `ecsWithFargateStandalone-${scope}`,
    scope: scope,
    env: {
      account: account || process.env.CDK_DEFAULT_ACCOUNT,
      region: region || process.env.CDK_DEFAULT_REGION,
    },
  },
);
