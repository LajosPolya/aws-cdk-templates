#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DeployEcrStack } from '../lib/deploy-ecr-stack';

const app = new cdk.App();

const repoName = app.node.getContext('repoName');
const account = app.node.getContext('account');
const region = app.node.getContext('region');

new DeployEcrStack(app, 'DeployEcrStack', {
  stackName: `deploy-ecr-${repoName}`,
  repoName,
  env: { account, region },
});
