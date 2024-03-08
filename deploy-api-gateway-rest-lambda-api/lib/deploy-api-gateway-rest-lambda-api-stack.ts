import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployApiGatewayRestLambdaApiStackProps
  extends cdk.StackProps {
  scope: string;
}

export class DeployApiGatewayRestLambdaApiStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployApiGatewayRestLambdaApiStackProps,
  ) {
    super(scope, id, props);

    // Lambda response must be in exactly this format
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
      functionName: `lambdaTriggeredByApiGateway-${props.scope}`,
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
      retryAttempts: 0,
    });

    const api = new cdk.aws_apigateway.LambdaRestApi(this, "lambdaApi", {
      handler: lambda,
      restApiName: `lambdaApi-${props.scope}`,
      endpointTypes: [cdk.aws_apigateway.EndpointType.REGIONAL],
      description: "Rest API backed by a lambda",
    });
  }
}
