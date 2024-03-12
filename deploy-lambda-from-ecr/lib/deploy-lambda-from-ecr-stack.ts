import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface DeployLambdaFromEcrStackProps extends cdk.StackProps {
  scope: string;
  ecr: cdk.aws_ecr.IRepository;
  tag: string;
}

export class DeployLambdaFromEcrStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployLambdaFromEcrStackProps,
  ) {
    super(scope, id, props);

    const ecrImageCode = cdk.aws_lambda.Code.fromEcrImage(props.ecr, {
      tagOrDigest: props.tag,
    });

    new cdk.aws_lambda.Function(this, "ecrImageCodeLambda", {
      runtime: cdk.aws_lambda.Runtime.FROM_IMAGE,
      code: ecrImageCode,
      handler: cdk.aws_lambda.Handler.FROM_IMAGE,
      description: "Lambda deployed from ECR",
      timeout: cdk.Duration.seconds(3),
      functionName: `ecrCodeLambda-${props.scope}`,
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
      retryAttempts: 0,
    });
  }
}
