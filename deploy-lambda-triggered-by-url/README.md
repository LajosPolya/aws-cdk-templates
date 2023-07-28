# Deploy a Lambda

This CDK app deploys a Lambda. This Lambda is configured to be triggered by calling a URL. The Lambda's code is contained in this repo for simplicity.

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

Before deploying this lambda, first follow the instructions in [lambda-handler](../lambda-handler/README.md) to build a zip file of the Lambda handler's code.

`cdk deploy -c scope=<scope>"`

This deploys a Lambda which when invoked by calling its URL will synchronously respond with a JSON message. To invoke the lambda via CLI execute the following command:

`curl --location '<lambdaUrl>'`

where `lambdaUrl` is the URL of the lambda. The lambda's URL is exported by this CDK app and therefore printed to the CLI when the app is deployed. The lambda's URL can also be found in the AWS Console on the lambda's page.

The app will set the environment (account and region) based on the the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

> **Warning** To prevent accidental execution of the lambda and to prevent runaway cost, always destroy this AWS environment when it's not in use.

`cdk destroy -c scope=<scope>`
