# Deploy a Lambda Triggered by its URL

This CDK app deploys a Lambda. This Lambda is configured to be triggered by calling a URL. The Lambda's code is contained in this repo for simplicity.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run check` checks if files are formatted
- `npm run format` formats files
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Deployment :rocket:

Before deploying this lambda, first follow the instructions in [lambda-handler](../lambda-handler/README.md) to build a zip file of the Lambda handler's code.

### \*nix/Mac

```console
cdk deploy -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd deploy -c scope=<scope>
```

This deploys a Lambda which when invoked by calling its URL will synchronously respond with a JSON message. To invoke the lambda via CLI execute the following command:

```console
curl --location '<lambdaUrl>'
```

where `lambdaUrl` is the URL of the lambda. The lambda's URL is exported by this CDK app and therefore printed to the CLI when the app is deployed. The lambda's URL can also be found in the AWS Console on the lambda's page.

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
