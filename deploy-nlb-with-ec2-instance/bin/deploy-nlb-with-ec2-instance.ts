#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployNlbWithEc2InstanceStack } from "../lib/deploy-nlb-with-ec2-instance-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
new DeployNlbWithEc2InstanceStack(app, "DeployNlbWithEc2InstanceStack", {
  stackName: `nlbWithEc2Instance-${scope}`,
  scope: scope,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
