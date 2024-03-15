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

    const dockerImageCode =
      cdk.aws_lambda.DockerImageCode.fromImageAsset("../lambda-handler");

    const lambda = new cdk.aws_lambda.DockerImageFunction(
      this,
      "dockerImageLambda",
      {
        code: dockerImageCode,
        description: "Lambda deployed from local Docker image",
        timeout: cdk.Duration.seconds(3),
        functionName: `dockerImageLambda-${props.scope}`,
        logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
        retryAttempts: 0,
      },
    );

    new cdk.CfnOutput(this, "lambdaName", {
      description: "Lambda function's name",
      value: lambda.functionName,
      exportName: `lambdaFunctionName-${props.scope}`,
    });
  }
}
