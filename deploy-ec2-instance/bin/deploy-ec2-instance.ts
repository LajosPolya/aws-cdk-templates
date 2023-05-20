#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployEc2InstanceStack } from "../lib/deploy-ec2-instance-stack";

const app = new cdk.App();

const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");

new DeployEc2InstanceStack(app, "DeployEc2InstanceStack", {
  stackName: `deploy-ec2-instance-${scope}`,
  scope,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
