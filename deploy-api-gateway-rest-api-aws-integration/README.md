# Deploy API Gateway REST API with AWS Integration

This CDK app deploys an API Gateway REST API with AWS Integration, specifially the API is integrated with AWS SQS.

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

`cdk deploy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd deploy -c scope=<scope>`

The app will set the environment (account and region) based on the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

This deploys an API Gateway REST API integrated with an AWS SQS queue.

### cURL :curling_stone:

A message can be placed in the queue by calling the API Gateway.

`curl --header "Content-Type: application/json" --request POST --data '{"hello":"world","integration":"sqs"}' <api_url>`

Once the message is placed in the queue, it can be view with the following AWS CLI command:

`aws sqs receive-message --queue-url <queue_url>`

Where both `api_url` and `queue_url` are exported by the CDK and therefore printed to the CLI during deployment.

## Destruction :boom:

> **Warning** The API Gateway deployed by this app is open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope>`
