import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class DeployS3StaticWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new cdk.aws_s3.Bucket(this, "s3StaticWebsite", {
      bucketName: `s3-static-website-1`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      websiteIndexDocument: "index.html",
      // accessControl: cdk.aws_s3.BucketAccessControl.PUBLIC_READ,
      publicReadAccess: true,
      blockPublicAccess: new cdk.aws_s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: true,
        restrictPublicBuckets: false,
      }),
    });
  }
}
