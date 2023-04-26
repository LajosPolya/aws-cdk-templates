#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DeployEcrStack } from '../lib/deploy-ecr-stack';

const app = new cdk.App();

const envName = app.node.getContext('envName');
const account = app.node.getContext('account');
const region = app.node.getContext('region');

new DeployEcrStack(app, 'DeployEcrStack', {
  stackName: `deploy-ecr-${envName}`,
  envName,
  env: { account, region },
});
