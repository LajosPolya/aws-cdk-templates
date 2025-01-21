#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployApiGatewayRestApiMockIntegrationStack } from "../lib/deploy-api-gateway-rest-api-mock-integration-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
new DeployApiGatewayRestApiMockIntegrationStack(app, "DeployApiGatewayRestMockApiStack", {
  stackName: `apiGatewayRestMockApi-${scope}`,
  scope: scope,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
