#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployVpcToVpcPeeringStack } from "../lib/deploy-vpc-to-vpc-peering-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
new DeployVpcToVpcPeeringStack(app, "DeployVpcToVpcPeeringStack", {
  stackName: `vpcPeering-${scope}`,
  scope,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
