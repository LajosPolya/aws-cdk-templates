#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployVpcStack } from "../lib/deploy-vpc-stack";
import { DeployEc2Stack } from "../lib/deploy-ec2-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const vpcTag = app.node.getContext("vpcTag");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");

const vpcStack = new DeployVpcStack(app, "DeployVpcStack", {
  stackName: `vpc-${scope}`,
  scope: scope,
  vpcTag: vpcTag,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});

new DeployEc2Stack(app, "DeployEc2Stack", {
  stackName: `vpcEc2-${scope}`,
  scope: scope,
  vpcL1: vpcStack.vpcL1,
  publicSubnet: vpcStack.publicSubnet,
  privateWithEgressSubnet: vpcStack.privateWithEgressSubnet,
  privateIsolatedSubnet: vpcStack.privateIsolatedSubnet,
  stackTags: vpcStack.stackTags,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
