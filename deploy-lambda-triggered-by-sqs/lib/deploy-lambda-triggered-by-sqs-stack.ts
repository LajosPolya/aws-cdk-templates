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
    });

    eventSource.bind(lambda);
  }
}
