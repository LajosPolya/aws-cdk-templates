import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployEcrStackProps extends cdk.StackProps {
  repoName: string;
}

export class DeployEcrStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeployEcrStackProps) {
    super(scope, id, props);

    new cdk.aws_ecr.Repository(this, "repository", {
      repositoryName: props.repoName || "default_name",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: false,
      emptyOnDelete: true,
    });
  }
}
