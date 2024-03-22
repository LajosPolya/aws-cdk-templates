import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployApiGatewayHttpApiLambdaIntegrationStackProps
  extends cdk.StackProps {
  scope: string;
}

export class DeployApiGatewayHttpApiLambdaIntegrationStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployApiGatewayHttpApiLambdaIntegrationStackProps,
  ) {
    super(scope, id, props);

    // Lambda response must be in this exact format
    const inlineCode = cdk.aws_lambda.Code.fromInline(`
exports.handler = async(event) => {
  console.log(JSON.stringify(event));
  return {
    "isBase64Encoded": false,
    "statusCode": 200,
    "headers": {
        "Content-Type": "application/json"
    },
    "body": "Lambda Successfully executed. Check logs for additional info."
  };
};    
    `);

    const lambda = new cdk.aws_lambda.Function(this, "inlineCodeLambda", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      code: inlineCode,
      handler: "index.handler",
      description:
        "Lambda deployed with inline code and triggered by API Gateway",
      timeout: cdk.Duration.seconds(3),
      functionName: `httpApiGatewayLambda-${props.scope}`,
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
      retryAttempts: 0,
    });

    const lambdaIntegration =
      new cdk.aws_apigatewayv2_integrations.HttpLambdaIntegration(
        "lambdaIntegration",
        lambda,
      );

    const api = new cdk.aws_apigatewayv2.HttpApi(this, "httpApi", {
      apiName: `lambdaHttpApi-${props.scope}`,
      description: "HTTP API with Lambda Integration",
    });

    api.addRoutes({
      path: "/lambda",
      integration: lambdaIntegration,
    });

    new cdk.CfnOutput(this, "apiEndpoint", {
      description: "API Endpoint",
      value: api.apiEndpoint,
      exportName: `apiGatewayEndpoint-${props.scope}`,
    });
  }
}
