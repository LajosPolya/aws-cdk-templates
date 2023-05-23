#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployAlbWithEc2AutoScalingGroupStack } from "../lib/deploy-alb-with-ec2-auto-scaling-group-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const deploySecondInstanceCron = app.node.getContext(
  "deploySecondInstanceCron"
);
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");

new DeployAlbWithEc2AutoScalingGroupStack(
  app,
  "DeployAlbWithEc2AutoScalingGroupStack",
  {
    stackName: `deploy-alb-with-ec2-auto-scaling-group-${scope}`,
    scope,
    deploySecondInstanceCron,
    env: {
      account: account || process.env.CDK_DEFAULT_ACCOUNT,
      region: region || process.env.CDK_DEFAULT_REGION,
    },
  }
);
