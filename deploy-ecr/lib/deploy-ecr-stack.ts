import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class DeployEcrStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repository = new cdk.aws_ecr.Repository(this, 'Repository', {
      repositoryName: 'micronaut-api',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: false,
      autoDeleteImages: true,
    });
  }
}
