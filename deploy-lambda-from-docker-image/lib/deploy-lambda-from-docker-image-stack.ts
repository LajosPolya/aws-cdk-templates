import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface DeployLambdaFromDockerImageStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployLambdaFromDockerImageStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployLambdaFromDockerImageStackProps,
  ) {
    super(scope, id, props);

    const dockerImageCode = cdk.aws_lambda.Code.fromDockerBuild(
      "../lambda-handler",
      {
        imagePath: "/var/task/",
        outputPath: "output",
      },
    );

    const lambda = new cdk.aws_lambda.Function(this, "dockerImageLambda", {
      runtime: cdk.aws_lambda.Runtime.FROM_IMAGE,
      code: dockerImageCode,
      handler: "Handler.FROM_IMAGE",
      description: "Lambda deployed from local Docker image",
      timeout: cdk.Duration.seconds(3),
      functionName: `dockerImageLambda-${props.scope}`,
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
      retryAttempts: 0,
    });

    new cdk.CfnOutput(this, "lambdaName", {
      description: "Lambda function's name",
      value: lambda.functionName,
      exportName: `lambdaFunctionName-${props.scope}`,
    });
  }
}
