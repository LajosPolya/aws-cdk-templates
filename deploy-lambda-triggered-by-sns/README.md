# Deploy a Lambda Triggered by an SNS Event

This CDK app deploys a Lambda. This Lambda is configured to be triggered by messages sent by an SNS topic. The Lambda's code is contained in this repo for simplicity.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run check` checks if files are formatted
- `npm run format` formats files
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Deployment :rocket:

Before deploying this lambda, first follow the instructions in [lambda-handler-with-sns-event](../lambda-handler-with-sns-event/README.md) to build a zip file of the Lambda handler's code.

### \*nix/Mac

`cdk deploy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd deploy -c scope=<scope>`

The app will set the environment (account and region) based on the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

This deploys a Lambda which when invoked by an SNS message will print the body of the message to a log. To invoke the lambda via CLI execute the following command:

`aws sns publish --topic-arn <topic-arn> --message "Hello World!"`

The `topic-arn` represents the SNS topic's ARN. This value is exported by the CDK and therefore printed to the command line when the app is deployed.

To find the output of the Lambda visit the AWS Console and go to CloudWatch -> Log groups -> `<logGroupName>` -> and click on the most recent Log Stream. The message "Hello World!" will be printed in the logs. The `logGroupName` represents the Lambda's Log Group name which is exported by the CDK and therefore printed to the command line when the app is deployed.

## Destruction :boom:

> **Warning** To prevent accidental execution of the lambda and to prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope>`
