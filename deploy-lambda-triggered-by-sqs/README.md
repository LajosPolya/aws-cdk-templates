# Deploy a Lambda

This CDK app deploys a Lambda. This Lambda is configured to be triggered by messages on an SQS queue. The Lambda's code is contained in this repo for simplicity.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npm run check` checks if files are formatted
- `npm run format` formats files
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Deployment

Before deploying this lambda, first follow the instructions in [lambda-handler-with-sqs-event](../lambda-handler-with-sqs-event/README.md) to build a zip files of the Lambda handler's code.

`cdk deploy -c scope=<scope>`

The app will set the environment (account and region) based on the the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

This deploys a Lambda which when invoked by an SQS message will print the body of the message to a log. To invoke the lambda via CLI execute the following command:

`aws sqs send-message --queue-url <queue-url> --message-body "{ \"message\": \"hello world\" }"`

The `queue-url` parameter can either be the SQS queue's name or its URL. The name takes the form `queue-to-trigger-lambda-<scope>` where scope is the context variable named `scope` when deploying the lambda. The URL can be found on the Simple Queue Service page of the AWS Console.

To find the output of the Lambda visit the AWS Console and go to CloudWatch -> Log groups -> `/aws/lambda/lambdaTriggeredBySqs-<scope>` -> and click on the most recent Log Stream. The message "hello world" will be printed in the logs.

> **Warning** To prevent accidental execution of the lamnda and to prevent runaway cost, always destroy this AWS environment when it's not in use.

`cdk destroy -c scope=<scope>`
