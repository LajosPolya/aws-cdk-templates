# Deploy a Lambda Triggered by an SQS Message

This CDK app deploys a Lambda. This Lambda is configured to be triggered by messages on an SQS queue. The Lambda's code is contained in this repo for simplicity.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run check` checks if files are formatted
- `npm run format` formats files
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Deployment :rocket:

Before deploying this lambda, first follow the instructions in [lambda-handler-with-sqs-event](../lambda-handler-with-sqs-event/README.md) to build a zip file of the Lambda handler's code.

### \*nix/Mac

```console
cdk deploy -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd deploy -c scope=<scope>
```

This deploys a Lambda which when invoked by an SQS message will print the body of the message to a log. To invoke the lambda via CLI execute the following command:

```console
aws sqs send-message --queue-url <queue-url> --message-body "{ \"message\": \"hello world\" }"
```

The `queue-url` parameter can either be the SQS queue's name or its URL. This value is exported by the CDK and therefore printed to the command line when the app is deployed.

To find the output of the Lambda visit the AWS Console and go to CloudWatch -> Log groups -> `<logGroupName>` -> and click on the most recent Log Stream. The message "hello world" will be printed in the logs. The `logGroupName` represents the Lambda's Log Group name which is exported by the CDK and therefore printed to the command line when the app is deployed.

## Destruction :boom:

> [!WARNING]
> To prevent accidental execution of the lambda and to prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

```console
cdk destroy -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd destroy -c scope=<scope>
```
