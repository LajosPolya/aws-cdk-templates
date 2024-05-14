#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployApiGatewayHttpApiNlbIntegrationStack } from "../lib/deploy-api-gateway-http-api-nlb-integration-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
new DeployApiGatewayHttpApiNlbIntegrationStack(
  app,
  "DeployApiGatewayHttpApiNlbIntegrationStack",
  {
    stackName: `httpApiGatewayWithNlb-${scope}`,
    scope,
    env: {
      account: account || process.env.CDK_DEFAULT_ACCOUNT,
      region: region || process.env.CDK_DEFAULT_REGION,
    },
  },
);
