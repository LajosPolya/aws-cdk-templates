#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployApiGatewayRestApiLambdaIntegrationStack } from "../lib/deploy-api-gateway-rest-api-lambda-integration-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
new DeployApiGatewayRestApiLambdaIntegrationStack(
  app,
  "DeployApiGatewayRestApiLambdaIntegrationStack",
  {
    stackName: `apiGatewayRestLambdaApi-${scope}`,
    scope: scope,
    env: {
      account: account || process.env.CDK_DEFAULT_ACCOUNT,
      region: region || process.env.CDK_DEFAULT_REGION,
    },
  },
);
