# Deploy API Gateway Websocket API with Lambda Integration

This CDK app deploys an API Gateway Websocket API backed by Lambda.

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

This deploys an API Gateway Websocket API backed by Lambda. This API is backed by an instance of AWS Lambda and can be accessed by the API's **Websocket URL** which is exported by the CDK and therefore printed to the CLI when the app is deployed.

### Make a request to the Websocket URL

1. Install `wscat`

`npm install -g wscat`

2. Connect to the Websocket API

`wscat -c <websocket_url>`

3. Send a message to the Websocket API

Sending a message to the Websocket API will execute the lambda that's integrated with it. The API responds to the following actions: `connect`, `disconnect`, or `default` routes. For example:

`{"action":"default"}`

To exit the CLI press `CTRL+C`

## Destruction :boom:

> **Warning** The API Gateway deployed by this app is open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope>`
