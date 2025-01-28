import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployLambdaFromS3StackProps extends cdk.StackProps {
  scope: string;
  bucketArn: string;
  objectKey: string;
}

export class DeployLambdaFromS3Stack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployLambdaFromS3StackProps
  ) {
    super(scope, id, props);

    const bucket = cdk.aws_s3.Bucket.fromBucketArn(
      this,
      "bucket",
      props.bucketArn
    );

    const bucketCode = cdk.aws_lambda.Code.fromBucket(bucket, props.objectKey);

    new cdk.aws_lambda.Function(this, "s3CodeLambda", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_22_X,
      code: bucketCode,
      handler: "index.handler",
      description: "Lambda deployed with code from an S3 bucket",
      timeout: cdk.Duration.seconds(3),
      functionName: `bucketCodeLambda-${props.scope}`,
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
      retryAttempts: 0,
    });
  }
}
