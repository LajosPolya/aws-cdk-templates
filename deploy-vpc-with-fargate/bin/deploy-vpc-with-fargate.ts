#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DeployVpcWithFargateStack } from '../lib/deploy-vpc-with-fargate-stack';

const app = new cdk.App();

const ecrArn = app.node.getContext('ecrArn');
const envName = app.node.getContext('envName');
const account = app.node.getContext('account');
const region = app.node.getContext('region');

new DeployVpcWithFargateStack(app, 'DeployVpcWithFargateStack', {
  stackName: `deploy-ecr-${envName}`,
  ecrArn,
  envName,
  env: { account, region },
});