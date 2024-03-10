import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface DeployLambdaTriggeredByApiGatewayStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployLambdaTriggeredByApiGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeployLambdaTriggeredByApiGatewayStackProps) {
    super(scope, id, props);

    // The lambda handler must be compiled, otherwise this will throw an error
    const asset = cdk.aws_lambda.Code.fromAsset(
      "../lambda-handler-with-api-gateway-event/dist/index.zip",
    );

    const proxyLambda = new cdk.aws_lambda.Function(
      this,
      "proxyLambda",
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
        code: asset,
        handler: "index.handler",
        description:
          "Proxy Lambda deployed with inline code and triggered by API Gateway",
        timeout: cdk.Duration.seconds(3),
        functionName: `lambdaTriggeredByApiGatewayProxy-${props.scope}`,
        logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
        retryAttempts: 0,
      },
    );

    const api = new cdk.aws_apigateway.LambdaRestApi(this, "lambdaApi", {
      handler: proxyLambda,
      restApiName: `lambdaApiGateway-${props.scope}`,
      endpointTypes: [cdk.aws_apigateway.EndpointType.REGIONAL],
      description: "Rest API backed by a lambda",
      proxy: true,
    });
  }
}
