import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployLambdaTriggeredByEventbridgeStackProps
  extends cdk.StackProps {
  scope: string;
  triggerLambdaCron: string;
}

export class DeployLambdaTriggeredByEventbridgeStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployLambdaTriggeredByEventbridgeStackProps,
  ) {
    super(scope, id, props);

    const asset = cdk.aws_lambda.Code.fromAsset(
      "../lambda-handler-with-eventbridge-event/dist/index.zip",
    );

    const lambda = new cdk.aws_lambda.Function(
      this,
      "lambdaTriggeredByEventBridge",
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        code: asset,
        handler: "index.handler",
        description: "Lambda triggered by EventBridge",
        timeout: cdk.Duration.seconds(3),
        functionName: `lambdaTriggeredByEventBridge-${props.scope}`,
        logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
        retryAttempts: 0,
      },
    );

    const target = new cdk.aws_events_targets.LambdaFunction(lambda, {});

    const rule = new cdk.aws_events.Rule(this, "rule", {
      targets: [target],
      schedule: cdk.aws_events.Schedule.expression(
        `cron(${props.triggerLambdaCron})`,
      ),
      description: "EventBridge Rule to Trigger Lambda",
      ruleName: `ruleToTriggerLambda-${props.scope}`,
    });

    new cdk.CfnOutput(this, "logGroupName", {
      description: "Name of the Lambda's Log Group",
      value: lambda.logGroup.logGroupName,
      exportName: `logGroupName-${props.scope}`,
    });
  }
}
