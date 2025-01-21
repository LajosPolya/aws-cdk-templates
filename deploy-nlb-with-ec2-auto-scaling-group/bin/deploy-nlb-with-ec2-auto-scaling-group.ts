#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployNlbWithEc2AutoScalingGroupStack } from "../lib/deploy-nlb-with-ec2-auto-scaling-group-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const deploySecondInstanceCron = app.node.getContext(
  "deploySecondInstanceCron"
);
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
new DeployNlbWithEc2AutoScalingGroupStack(
  app,
  "DeployNlbWithEc2AutoScalingGroupStack",
  {
    stackName: `albWithEc2AutoScalingGroup-${scope}`,
    scope: scope,
    deploySecondInstanceCron,
    env: {
      account: account || process.env.CDK_DEFAULT_ACCOUNT,
      region: region || process.env.CDK_DEFAULT_REGION,
    },
  }
);
