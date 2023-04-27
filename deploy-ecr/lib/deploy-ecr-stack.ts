import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface DeployEcrStackProps extends cdk.StackProps {
  repoName: string;
}

export class DeployEcrStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeployEcrStackProps) {
    super(scope, id, props);

    const repository = new cdk.aws_ecr.Repository(this, 'Repository', {
      repositoryName: props.repoName || 'default_name',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: false,
      autoDeleteImages: true,
    });
  }
}
