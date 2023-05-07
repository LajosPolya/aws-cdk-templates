#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DeployEcrStack } from '../lib/deploy-ecr-stack';

const app = new cdk.App();

const repoName = app.node.getContext('repoName');
const account = app.node.tryGetContext('account');
const region = app.node.tryGetContext('region');

new DeployEcrStack(app, 'DeployEcrStack', {
  stackName: `deploy-ecr-${repoName}`,
  repoName,
  env: { 
    account: account || process.env.CDK_DEFAULT_ACCOUNT, 
    region: region || process.env.CDK_DEFAULT_REGION,
  },
});
