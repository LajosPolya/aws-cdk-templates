import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployLambdaStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeployLambdaStackProps) {
    super(scope, id, props);

    const inlineCode = cdk.aws_lambda.Code.fromInline(`
exports.handler = async(event) => {
  return {
      statusCode: 200,
      body: JSON.stringify('Hello from Lambda!'),
  };
};    
    `);

    new cdk.aws_lambda.Function(this, "inlineCodeLambda", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      code: inlineCode,
      handler: "index.handler",
      description: "Lambda deployed with inline code",
      timeout: cdk.Duration.seconds(3),
      functionName: `inlineCodeLambda-${props.scope}`,
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
    });
  }
}
