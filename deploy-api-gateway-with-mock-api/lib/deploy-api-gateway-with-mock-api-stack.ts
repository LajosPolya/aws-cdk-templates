import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class DeployApiGatewayWithMockApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const mockIntegration = new cdk.aws_apigateway.MockIntegration({
      integrationResponses: [
        {
          statusCode: "200",
          responseTemplates: {
            "application/json": `{
  "statusCode": 200,
  "body": {
    "message": "Success"
  } 
}`,
          },
        },
      ],
      requestTemplates: {
        "application/json": `{
          "statusCode": 200,
        }`,
      },
    });

    const api = new cdk.aws_apigateway.RestApi(this, "restAPi", {
      defaultIntegration: mockIntegration,
      defaultMethodOptions: {
        methodResponses: [
          {
            statusCode: "200",
          },
        ],
      },
      restApiName: "mockRestApi",
      endpointTypes: [cdk.aws_apigateway.EndpointType.REGIONAL],
      description: "A mock REST API",
    });

    const method = new cdk.aws_apigateway.Method(this, "method", {
      resource: api.root,
      httpMethod: "GET",
      integration: mockIntegration,
      options: {
        methodResponses: [
          {
            statusCode: "200",
          },
        ],
      },
    });
    mockIntegration.bind(method);

    new cdk.aws_apigateway.Deployment(this, "deployment", {
      api: api,
      description: "deployment",
    });
  }
}
