import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployApiGatewayRestApiLambdaIntegrationStackProps
  extends cdk.StackProps {
  scope: string;
}

export class DeployApiGatewayRestApiLambdaIntegrationStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployApiGatewayRestApiLambdaIntegrationStackProps,
  ) {
    super(scope, id, props);

    // Lambda response must be in this exact format
    const parentInlineCode = cdk.aws_lambda.Code.fromInline(`
exports.handler = async(event) => {
  console.log(JSON.stringify(event));
  return {
    "isBase64Encoded": false,
    "statusCode": 200,
    "headers": {
        "Content-Type": "application/json"
    },
    "body": "Parent Lambda Successfully executed. Check logs for additional info."
  };
};    
    `);

    const parentLambda = new cdk.aws_lambda.Function(
      this,
      "inlineParentCodeLambda",
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
        code: parentInlineCode,
        handler: "index.handler",
        description:
          "Parent Lambda deployed with inline code and triggered by API Gateway",
        timeout: cdk.Duration.seconds(3),
        functionName: `lambdaTriggeredByApiGatewayParent-${props.scope}`,
        logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
        retryAttempts: 0,
      },
    );

    // Lambda response must be in this exact format
    const proxyInlineCode = cdk.aws_lambda.Code.fromInline(`
exports.handler = async(event) => {
  console.log(JSON.stringify(event));
  return {
    "isBase64Encoded": false,
    "statusCode": 200,
    "headers": {
        "Content-Type": "application/json"
    },
    "body": "Proxy Lambda Successfully executed. Called by " + event.path + ". Check logs for additional info."
  };
};
    `);

    const proxyLambda = new cdk.aws_lambda.Function(
      this,
      "inlineProxyCodeLambda",
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_22_X,
        code: proxyInlineCode,
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
      handler: parentLambda,
      restApiName: `lambdaApi-${props.scope}`,
      endpointTypes: [cdk.aws_apigateway.EndpointType.REGIONAL],
      description: "Rest API backed by a lambda",
      proxy: false,
    });

    const parentPath = api.root.addResource("parent");
    parentPath.addMethod("GET");

    const proxyLambdaIntegration = new cdk.aws_apigateway.LambdaIntegration(
      proxyLambda,
    );
    parentPath.addProxy({
      defaultIntegration: proxyLambdaIntegration,
    });
  }
}
