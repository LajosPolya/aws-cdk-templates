#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployEc2AutoscalingGroupStack } from "../lib/deploy-ec2-auto-scaling-group-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const deploySecondInstanceCron = app.node.getContext(
  "deploySecondInstanceCron"
);
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");

new DeployEc2AutoscalingGroupStack(app, "DeployEc2AutoscalingGroupStack", {
  stackName: `ec2AutoScalingGroup-${scope}`,
  scope: scope,
  deploySecondInstanceCron,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
