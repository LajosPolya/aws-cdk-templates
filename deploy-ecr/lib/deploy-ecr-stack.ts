import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployEcrStackProps extends cdk.StackProps {
  repoName: string;
}

export class DeployEcrStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeployEcrStackProps) {
    super(scope, id, props);

    const repo = new cdk.aws_ecr.Repository(this, "repository", {
      repositoryName: props.repoName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: false,
      emptyOnDelete: true,
    });

    new cdk.CfnOutput(this, 'repoUrl', {
      description: "Repo URL",
      value: repo.repositoryUri,
      exportName: `repoUrl-${props.repoName}`
    })
  }
}
