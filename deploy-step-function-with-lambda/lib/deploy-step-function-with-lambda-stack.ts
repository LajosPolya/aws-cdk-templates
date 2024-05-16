import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployStepFunctionWithLambdaStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployStepFunctionWithLambdaStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployStepFunctionWithLambdaStackProps,
  ) {
    super(scope, id, props);

    const lamda = new cdk.aws_lambda.Function(this, "inlineLambda", {
      code: cdk.aws_lambda.Code.fromAsset(
        "../lambda-handler-with-stepfunction/dist/index.zip",
      ),
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      timeout: cdk.Duration.seconds(3),
    });

    const successState = new cdk.aws_stepfunctions.Succeed(this, "suceed");
    const failedState = new cdk.aws_stepfunctions.Fail(this, "failedState");

    const lambdaInvoke = new cdk.aws_stepfunctions_tasks.LambdaInvoke(
      this,
      "lambdaTask",
      {
        lambdaFunction: lamda,
        stateName: `lambda-${props.scope}`,
        comment: "Executes a lambda and handles errors based on error type",
        taskTimeout: cdk.aws_stepfunctions.Timeout.duration(
          cdk.Duration.seconds(5),
        ),
      },
    );

    lambdaInvoke.addRetry({
      errors: ["RetryableError"],
    });

    const successCatchState = new cdk.aws_stepfunctions.Pass(
      this,
      "recoverableState",
      {
        stateName: "recover",
        comment: "Catches specific exceptions and moves to success state",
      },
    );

    successCatchState.next(successState);

    lambdaInvoke.addCatch(successCatchState, {
      errors: ["RecoverableTaskError"],
    });

    const failedCatchState = new cdk.aws_stepfunctions.Pass(
      this,
      "nonRecoverableState",
      {
        stateName: `error`,
        comment: "Catches specific exceptions and moves to failed state",
      },
    );
    failedCatchState.next(failedState);

    lambdaInvoke.addCatch(failedCatchState, {
      errors: ["UndefinedTaskError", "UnknownTaskError"],
    });

    lambdaInvoke.next(successState);

    new cdk.aws_stepfunctions.ChainDefinitionBody(lambdaInvoke);

    new cdk.aws_stepfunctions.StateMachine(this, "stateMachine", {
      stateMachineName: `smWithLambda-${props.scope}`,
      definitionBody: new cdk.aws_stepfunctions.ChainDefinitionBody(
        lambdaInvoke,
      ),
    });
  }
}
