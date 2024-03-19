import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployApiGatewayRestApiAwsIntegrationStackStackProps
  extends cdk.StackProps {
  scope: string;
}

export class DeployApiGatewayRestApiAwsIntegrationStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployApiGatewayRestApiAwsIntegrationStackStackProps,
  ) {
    super(scope, id, props);

    const api = new cdk.aws_apigateway.RestApi(this, "restApiAwsIntegration", {
      endpointConfiguration: {
        types: [cdk.aws_apigateway.EndpointType.REGIONAL],
      },
      restApiName: `restApiIntegration-${props.scope}`,
    });

    const principal = new cdk.aws_iam.ServicePrincipal(
      "apigateway.amazonaws.com",
    );
    const role = new cdk.aws_iam.Role(this, "apiGatewayRole", {
      assumedBy: principal,
      roleName: `apiGatewayRole-${props.scope}`,
      description: "Role assumed by API Gateway",
    });

    const queueName = `apiGatewayQueue-${props.scope}`;
    const queue = new cdk.aws_sqs.Queue(this, "sqs", {
      queueName: queueName,
      retentionPeriod: cdk.Duration.hours(1),
      /* After dequeuing, the processor has this much time to handle the message and delete it from the 
      queue before it becomes visible again for dequeueing by another processor.
      Therefore it is not recommended to set this value to 0 in production because will duplicate processing 
      of messages. */
      visibilityTimeout: cdk.Duration.seconds(0),
    });
    queue.grantSendMessages(role);

    /* Generates the request sent the SQS based on the request sent by the client.
    Sets the query parameter `Action` to `SendMessage` on the request to SQS.
    Sets the query parameter `MessageBody` to the request body from request sent by the client.
    In the end the request has the following format:
    https://<sqs_uri>/<account_id>/<queue_name>?Action=SendMessage&MessageBody=<cient_request_body> */
    const sqsIntegration = new cdk.aws_apigateway.AwsIntegration({
      service: "sqs",
      path: queueName,
      options: {
        requestParameters: {
          "integration.request.querystring.Action": "'SendMessage'",
          "integration.request.querystring.MessageBody": "method.request.body",
        },
        integrationResponses: [
          {
            statusCode: "200",
          },
        ],
        credentialsRole: role,
        passthroughBehavior:
          cdk.aws_apigateway.PassthroughBehavior.WHEN_NO_MATCH,
      },
    });

    api.root.addMethod("POST", sqsIntegration, {
      operationName: `forwardToSqs-${props.scope}`,
      methodResponses: [
        {
          statusCode: "200",
        },
      ],
    });

    new cdk.CfnOutput(this, "queueUrl", {
      description: "URL of the SQS queue",
      exportName: `apiGatewayQueueUrl-${props.scope}`,
      value: queue.queueUrl,
    });
  }
}
