import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployLambdaTriggeredBySnsStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployLambdaTriggeredBySnsStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployLambdaTriggeredBySnsStackProps,
  ) {
    super(scope, id, props);

    const topic = new cdk.aws_sns.Topic(this, "SNS", {
      displayName: `topic-to-trigger-lambda-${props.scope}`,
      topicName: `topic-to-trigger-lambda-${props.scope}`,
    });

    const eventSource = new cdk.aws_lambda_event_sources.SnsEventSource(topic);

    const asset = cdk.aws_lambda.Code.fromAsset(
      "../lambda-handler-with-sns-event/dist/index.zip",
    );

    const lambda = new cdk.aws_lambda.Function(this, "lambdaTriggeredBySns", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      code: asset,
      handler: "index.handler",
      description: "Lambda triggered by SNS",
      timeout: cdk.Duration.seconds(3),
      functionName: `lambdaTriggeredBySns-${props.scope}`,
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
      retryAttempts: 0,
    });

    eventSource.bind(lambda);
  }
}
