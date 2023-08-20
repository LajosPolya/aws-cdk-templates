# Deploy a Lambda

This CDK app deploys a Lambda. This Lambda is configured to be triggered by events sent on EventBridge. The Lambda's code is contained in this repo for simplicity.

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

Before deploying this lambda, first follow the instructions in [lambda-handler-with-eventbridge-event](../lambda-handler-with-eventbridge-event/README.md) to build a zip file of the Lambda handler's code.

### *nix/Mac

`cdk deploy -c scope=<scope> -c triggerLambdaCron="<cron_schedule>"`

### Git Bash on Windows

`winpty cdk.cmd deploy -c scope=<scope> -c triggerLambdaCron="<cron_schedule>"`

- `triggerLambdaCron` is a valid cron expression (in UTC) stating when to trigger the Lambda. For example, `"30 15 * * ? *"`, translates to "trigger the lambda at 3:15pm UTC". More info on the EventBridge scheduler can be found at https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-cron-expressions.html

Once the lambda has been triggered, to look at the logs visit: AWS Console -> CloudWatch -> Log Groups -> `/aws/lambda/lambdaTriggeredByEventBridge-<scope>` -> Most recent Log Stream

The app will set the environment (account and region) based on the the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

## Destruction

> **Warning** To prevent accidental execution of the lambda and to prevent runaway cost, always destroy this AWS environment when it's not in use.

### *nix/Mac

`cdk destroy -c scope=<scope> -c triggerLambdaCron="<cron_schedule>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope> -c triggerLambdaCron="<cron_schedule>`
