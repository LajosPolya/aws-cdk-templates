import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployEcrStackProps extends cdk.StackProps {
  scope: string;
  imageTag: string;
}

export class DeployEcrStack extends cdk.Stack {
  repository: cdk.aws_ecr.IRepository;

  constructor(scope: Construct, id: string, props: DeployEcrStackProps) {
    super(scope, id, props);

    this.repository = new cdk.aws_ecr.Repository(this, "repository", {
      repositoryName: `repo-${props.scope}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: false,
      emptyOnDelete: true,
    });

    new cdk.CfnOutput(this, "repoUriForTag", {
      description: "The repositories URI for tagging",
      value: this.repository.repositoryUriForTag(props.imageTag),
      exportName: `repositoryUriForTag-${props.scope}`,
    });
  }
}
