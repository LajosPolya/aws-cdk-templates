# Deploy a Lambda from ECR

This CDK app deploys a Lambda whose code is stored in a private S3 bucket.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run check` checks if files are formatted
- `npm run format` formats files
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Deployment :rocket:

### Build the Lambda handler

Follow the instructions in [lambda-handler](../lambda-handler/README.md#Build-Docker-Container) to build the lambda handler. Note: only the lambda handler needs to be built with npm. The Docker image _DOES NOT_ need to be built.

### Deploy the Lambda

Start Docker before initiating the deployment.

#### \*nix/Mac

```console
cdk deploy -c scope=<scope>
```

#### Git Bash on Windows

```console
winpty cdk.cmd deploy -c scope=<scope>
```

This deploys a Lambda which when invoked will return a JSON string.

To invoke the lambda via CLI execute the following command:

```console
aws lambda invoke --function-name=<lambdaFunctionName> outfile.txt
```

Where `lambdaFunctionName` represents the Lambda function's name. The name of the function is exported by the CDK and therefore printed to the /CLI. View the contents of `outfile.txt` to explore the Lambda's response.

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
