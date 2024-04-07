#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployVpcToVpcNetworkStack } from "../lib/deploy-vpc-to-vpc-network-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
// const vpcTag = app.node.getContext("vpcTag");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");

new DeployVpcToVpcNetworkStack(app, "DeployVpcToVpcNetworkStack", {
  stackName: `vpcToVpcNetwork-${scope}`,
  scope,
  // vpcTag: vpcTag,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
