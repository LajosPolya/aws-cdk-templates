import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployApiGatewayWebsocketApiLambdaIntegrationStackProps
  extends cdk.StackProps {
  scope: string;
}

export class DeployApiGatewayWebsocketApiLambdaIntegrationStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployApiGatewayWebsocketApiLambdaIntegrationStackProps,
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
      functionName: `websocketApiGatewayLambda-${props.scope}`,
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
      retryAttempts: 0,
    });

    const connectRouteIntegration =
      new cdk.aws_apigatewayv2_integrations.WebSocketLambdaIntegration(
        "connect",
        lambda,
      );
    const disconnectRouteIntegration =
      new cdk.aws_apigatewayv2_integrations.WebSocketLambdaIntegration(
        "disconnect",
        lambda,
      );
    const defaultRouteIntegration =
      new cdk.aws_apigatewayv2_integrations.WebSocketLambdaIntegration(
        "default",
        lambda,
      );
    const api = new cdk.aws_apigatewayv2.WebSocketApi(this, "api", {
      apiName: `websocketApiWithLambaIntegration-${props.scope}`,
      description: "Websocket API with Lambda Integration",
      connectRouteOptions: {
        integration: connectRouteIntegration,
        returnResponse: true,
      },
      disconnectRouteOptions: {
        integration: disconnectRouteIntegration,
        returnResponse: true,
      },
      defaultRouteOptions: {
        integration: defaultRouteIntegration,
        returnResponse: true,
      },
    });

    const stage = new cdk.aws_apigatewayv2.WebSocketStage(this, "stage", {
      webSocketApi: api,
      stageName: "test",
      autoDeploy: true,
    });

    new cdk.CfnOutput(this, "url", {
      value: stage.url,
    });

    new cdk.CfnOutput(this, "callbackUrl", {
      value: stage.callbackUrl,
    });
  }
}
