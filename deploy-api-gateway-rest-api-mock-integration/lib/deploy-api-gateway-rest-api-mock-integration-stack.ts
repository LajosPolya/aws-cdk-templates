import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployApiGatewayRestApiMockIntegrationStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployApiGatewayRestApiMockIntegrationStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployApiGatewayRestApiMockIntegrationStackProps,
  ) {
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
        operationName: "Get root",
        methodResponses: [
          {
            statusCode: "200",
          },
        ],
      },
      restApiName: `mockRestApi-${props.scope}`,
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
      description: "Prod deployment",
    });
  }
}
