#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployApiGatewayWithRestMockApiStack } from "../lib/deploy-api-gateway-with-rest-mock-api-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
new DeployApiGatewayWithRestMockApiStack(app, "DeployApiGatewayWithRestMockApiStack", {
  stackName: `apiGatewatWithRestMockApi-${scope}`,
  scope,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
