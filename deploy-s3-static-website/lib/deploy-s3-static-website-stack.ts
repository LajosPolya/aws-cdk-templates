import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployS3StaticWebsiteStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployS3StaticWebsiteStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployS3StaticWebsiteStackProps
  ) {
    super(scope, id, props);

    const bucket = new cdk.aws_s3.Bucket(this, "s3StaticWebsite", {
      bucketName: `s3-static-website-${props.scope}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      blockPublicAccess: new cdk.aws_s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: true,
        restrictPublicBuckets: false,
      }),
    });

    new cdk.CfnOutput(this, "bucketName", {
      description: "The public bucket's name",
      value: bucket.bucketName,
      exportName: `bucketName-${props.scope}`,
    });

    new cdk.CfnOutput(this, "bucketWebsiteUrl", {
      description: "The public bucket's website URL",
      value: bucket.bucketWebsiteUrl,
      exportName: `bucketWebsiteUrl-${props.scope}`,
    });
  }
}
