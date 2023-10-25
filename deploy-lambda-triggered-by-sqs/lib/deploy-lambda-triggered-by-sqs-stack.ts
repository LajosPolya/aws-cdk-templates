import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployLambdaTriggeredBySqsStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployLambdaTriggeredBySqsStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployLambdaTriggeredBySqsStackProps,
  ) {
    super(scope, id, props);

    const queue = new cdk.aws_sqs.Queue(this, "Sqs", {
      queueName: `queue-to-trigger-lambda-${props.scope}`,
    });

    const eventSource = new cdk.aws_lambda_event_sources.SqsEventSource(queue);

    // The lambda handler must be compiled, otherwise this will throw an error
    const asset = cdk.aws_lambda.Code.fromAsset(
      "../lambda-handler-with-sqs-event/dist/index.zip",
    );

    const lambda = new cdk.aws_lambda.Function(this, "lambdaTriggeredBySqs", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      code: asset,
      handler: "index.handler",
      description: "Lambda triggered by SQS",
      timeout: cdk.Duration.seconds(3),
      functionName: `lambdaTriggeredBySqs-${props.scope}`,
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
      retryAttempts: 0,
    });

    eventSource.bind(lambda);

    new cdk.CfnOutput(this, "sqsUrl", {
      description: "The URL of the Queue used to trigger the Lambda",
      value: queue.queueUrl,
      exportName: `sqsUrl-${props.scope}`,
    });

    new cdk.CfnOutput(this, "logGroupName", {
      description: "The name of the Lambda's Log Group",
      value: lambda.logGroup.logGroupName,
      exportName: `logGroupName-${props.scope}`,
    });
  }
}
