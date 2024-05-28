# Deploy Step Function

This CDK app deploys a Step Function with a Lambda task.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run check` checks if files are formatted
- `npm run format` formats files
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Deployment :rocket:

### \*nix/Mac

```console
cdk deploy -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd deploy -c scope=<scope>
```

This deploys a Step Function with a Lambda task. This Step Function's behaviour depends on the input it was executed with. This input is passed into its Lambda task and the Lambda responds to the input accordingly. The following commands display how the Lambda and Step Funtion will respond. The variable `step_function_arn` is the Step Function's ARN and is exported by the CDK and therefore printed to the CLI after a deployment.

#### Successful Execution

```console
# execute the Step Function
aws stepfunctions start-execution --state-machine-arn <step_function_arn> --input '{"task":"succeed"}'
```

```console
# Describe the most recent Step Function execution
EXECUTION_ARN=$(aws stepfunctions list-executions --state-machine-arn <step_function_arn> --query "executions[0].executionArn" --output text)

# The execution's status should be successful
# The `output` should show the `Payload` containing a success message
aws stepfunctions describe-execution --execution-arn $EXECUTION_ARN
```

#### Recovered Task Execution

```console
# execute the Step Function
aws stepfunctions start-execution --state-machine-arn <step_function_arn> --input '{"task":"recover"}'
```

```console
# Describe the most recent Step Function execution
EXECUTION_ARN=$(aws stepfunctions list-executions --state-machine-arn <step_function_arn> --query "executions[0].executionArn" --output text)

# The execution's status should be successful
# The `output` should contain the error `RecoverableTaskError`
aws stepfunctions describe-execution --execution-arn $EXECUTION_ARN
```

#### Retryable Task Execution

```console
# execute the Step Function
aws stepfunctions start-execution --state-machine-arn <step_function_arn> --input '{"task":"retry"}'
```

```console
# Describe the most recent Step Function execution
EXECUTION_ARN=$(aws stepfunctions list-executions --state-machine-arn <step_function_arn> --query "executions[0].executionArn" --output text)

# The execution's status should be failed
aws stepfunctions describe-execution --execution-arn $EXECUTION_ARN
# The CLI will not show this information but the AWS Console shows that the execution was retried before it failed
```

#### Unknown Task Execution

```console
# execute the Step Function
aws stepfunctions start-execution --state-machine-arn <step_function_arn> --input '{}'
```

```console
# Describe the most recent Step Function execution
EXECUTION_ARN=$(aws stepfunctions list-executions --state-machine-arn <step_function_arn> --query "executions[0].executionArn" --output text)

# The execution's status should be failed
aws stepfunctions describe-execution --execution-arn $EXECUTION_ARN
```

## Destruction :boom:

### \*nix/Mac

```console
cdk destroy -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd destroy -c scope=<scope>
```
