# Deploy a Lambda

This CDK app deploys a Lambda. The Lambda's code is written inline in the CDK for simplicity.

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

This deploys a Lambda which when invoked will return a JSON string. To invoke the lambda via CLI execute the following command:

`aws lambda invoke --function-name=<lambdaFunctionName> outfile.txt`

The function name takes the form `inlineCodeLambda-<scope>` where scope is the context variable named `scope` when deploying the lambda.

## Destruction :boom:

> [!WARNING]
> To prevent accidental execution of the lambda and to prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope>`
