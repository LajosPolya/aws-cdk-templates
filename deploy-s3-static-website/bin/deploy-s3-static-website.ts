#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployS3StaticWebsiteStack } from "../lib/deploy-s3-static-website-stack";

const app = new cdk.App();
new DeployS3StaticWebsiteStack(app, "DeployS3StaticWebsiteStack", {});
