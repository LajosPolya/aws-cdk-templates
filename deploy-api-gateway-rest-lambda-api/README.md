# Deploy API Gateway REST API backed by Lambda

This CDK app deploys an API Gateway REST API backed by Lambda.

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

This deploys an API Gateway REST API backed by Lambda. This API is backed by two instances of AWS Lambda and can be accessed by the API's URL which is exported by the CDK and therefore printed to the CLI when the app is deployed.

### cURL :curling_stone:

The first lambda can be accessed by the `parent` endpoint.

`curl --location <api_url>/parent`

The second lambda is a proxy lambda for `/parent/*` which means it will execute for any path that begins with `parent/`, for example:

`curl --location <api_url>/parent/child`

### Browser :surfer:

The API will respond successfully if the URL is pasted into the browser.

## Destruction :boom:

> **Warning** The API Gateway deployed by this app is open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd deploy -c scope=<scope>`
