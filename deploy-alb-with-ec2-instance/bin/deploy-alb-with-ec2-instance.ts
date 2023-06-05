#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployAlbWithEc2InstanceStack } from "../lib/deploy-alb-with-ec2-instance-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
new DeployAlbWithEc2InstanceStack(app, "DeployAlbWithEc2InstanceStack", {
  stackName: `albWithEc2Instance-${scope}`,
  scope,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
