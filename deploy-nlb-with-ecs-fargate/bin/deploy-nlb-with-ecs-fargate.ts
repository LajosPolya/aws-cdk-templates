#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployNlbWithEcsFargateStack } from "../lib/deploy-nlb-with-ecs-fargate-stack";

const app = new cdk.App();
const ecrName = app.node.getContext("ecrName");
const imageTag = app.node.getContext("tag");
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
new DeployNlbWithEcsFargateStack(app, "DeployNlbWithEcsFargateStack", {
  stackName: `nlbWithEcsFargate-${scope}`,
  scope: scope,
  ecrName,
  imageTag,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
