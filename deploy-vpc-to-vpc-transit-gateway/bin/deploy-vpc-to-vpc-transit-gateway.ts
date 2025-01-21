#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployVpcToVpcTransitGatewayStack } from "../lib/deploy-vpc-to-vpc-transit-gateway-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");

new DeployVpcToVpcTransitGatewayStack(
  app,
  "DeployVpcToVpcTransitGatewayStack",
  {
    stackName: `vpcToVpcTransitGateway-${scope}`,
    scope: scope,
    env: {
      account: account || process.env.CDK_DEFAULT_ACCOUNT,
      region: region || process.env.CDK_DEFAULT_REGION,
    },
  },
);
