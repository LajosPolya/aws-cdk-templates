#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployApiGatewayWebsocketApiMockIntegrationStack } from "../lib/deploy-api-gateway-websocket-api-mock-integration-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");

new DeployApiGatewayWebsocketApiMockIntegrationStack(
  app,
  "DeployApiGatewayWebsocketApiLambdaIntegrationStack",
  {
    stackName: `apiGatewayWebsocketLambdaApi-${scope}`,
    scope,
    env: {
      account: account || process.env.CDK_DEFAULT_ACCOUNT,
      region: region || process.env.CDK_DEFAULT_REGION,
    },
  },
);
