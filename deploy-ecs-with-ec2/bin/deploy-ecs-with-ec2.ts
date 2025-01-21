#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployEcsWithEc2Stack } from "../lib/deploy-ecs-with-ec2-stack";

const app = new cdk.App();

const ecrName = app.node.getContext("ecrName");
const imageTag = app.node.getContext("tag");
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");

new DeployEcsWithEc2Stack(app, "DeployEcsWithEc2Stack", {
  stackName: `ecsWithEc2-${scope}`,
  ecrName,
  imageTag,
  scope: scope,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
