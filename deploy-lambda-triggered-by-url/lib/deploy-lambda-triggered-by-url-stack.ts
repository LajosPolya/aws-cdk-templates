import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployLambdaTriggeredByUrlStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployLambdaTriggeredByUrlStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployLambdaTriggeredByUrlStackProps,
  ) {
    super(scope, id, props);

    // The lambda handler must be compiled, otherwise this will throw an error
    const asset = cdk.aws_lambda.Code.fromAsset(
      "../lambda-handler/dist/index.zip",
    );

    const lambda = new cdk.aws_lambda.Function(this, "lambdaTriggeredBySqs", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      code: asset,
      handler: "index.handler",
      description: "Lambda triggered by URL",
      timeout: cdk.Duration.seconds(3),
      functionName: `lambdaTriggeredByUrl-${props.scope}`,
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
      retryAttempts: 0,
    });

    const lambdaUrl = lambda.addFunctionUrl({
      authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
    });

    new cdk.CfnOutput(this, "lambdaUrl", {
      description: "URL to trigger Lambda",
      value: lambdaUrl.url,
      exportName: `lambdaUrl-${props.scope}`,
    });
  }
}
