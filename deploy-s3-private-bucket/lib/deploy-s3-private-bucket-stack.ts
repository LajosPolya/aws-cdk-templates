import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployS3PrivateBucketStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployS3PrivateBucketStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployS3PrivateBucketStackProps
  ) {
    super(scope, id, props);

    const bucket = new cdk.aws_s3.Bucket(this, "s3PrivateBucket", {
      bucketName: `s3-private-bucket-${props.scope}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
    });

    new cdk.CfnOutput(this, "bucketName", {
      description: "The private bucket's name",
      value: bucket.bucketName,
      exportName: `bucketName-${props.scope}`,
    });
  }
}
