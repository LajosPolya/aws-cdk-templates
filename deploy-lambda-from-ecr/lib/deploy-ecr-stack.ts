import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployEcrStackProps extends cdk.StackProps {
  repoName: string;
}

export class DeployEcrStack extends cdk.Stack {
  ecr: cdk.aws_ecr.IRepository;

  constructor(scope: Construct, id: string, props: DeployEcrStackProps) {
    super(scope, id, props);

    this.ecr = new cdk.aws_ecr.Repository(this, "repository", {
      repositoryName: props.repoName || "default_name",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: false,
      emptyOnDelete: true,
    });
  }
}
