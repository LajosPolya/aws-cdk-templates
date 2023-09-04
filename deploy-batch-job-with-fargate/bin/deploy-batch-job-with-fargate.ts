#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { DeployBatchJobWithFargateStack } from "../lib/deploy-batch-job-with-fargate-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const ecrName = app.node.getContext("ecrName");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
new DeployBatchJobWithFargateStack(app, "DeployBatchJobWithFargateStack", {
  stackName: `batchJobWithFargate-${scope}`,
  scope,
  ecrName,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
