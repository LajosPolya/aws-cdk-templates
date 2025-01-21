#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployS3StaticWebsiteStack } from "../lib/deploy-s3-static-website-stack";

const app = new cdk.App();
const scope = app.node.getContext("scope");
const account = app.node.tryGetContext("account");
const region = app.node.tryGetContext("region");
new DeployS3StaticWebsiteStack(app, "DeployS3StaticWebsiteStack", {
  stackName: `s3StaticWebsite-${scope}`,
  scope: scope,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
