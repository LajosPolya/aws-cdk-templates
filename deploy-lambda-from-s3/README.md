# Deploy a Lambda from S3

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

Before deploying this lambda, first follow the instructions to deploy a [private S3 bucket](../deploy-s3-private-bucket/README.md) which houses the Lambda handler's code.

Next, follow the instructions in [lambda-handler](../lambda-handler/README.md) to build a zip file of the Lambda handler's code.

Then, upload the zip file to the private S3 bucket: 

```console
cd lambda-handler/dist
aws s3 cp index.zip s3://<bucket_name>
```

Finally, deploy the lambda:

### \*nix/Mac

```console
cdk deploy -c scope=<scope> -c bucketArn="<bucketArn>" -c objectKey=index.zip
```

### Git Bash on Windows

```console
winpty cdk.cmd deploy -c scope=<scope> -c bucketArn="<bucketArn>" -c objectKey=index.zip
```

Where `buckerArn` represents the S3 bucket's ARN and `objectKey` references the zip file's name in the S3 bucket.

This deploys a Lambda which when invoked will return a JSON string. Note, the deployer assumes that the handler function is called `handler` and lives in `index.js`.

To invoke the lambda via CLI execute the following command:

```console
aws lambda invoke --function-name=<lambdaFunctionName> outfile.txt
```

The function name takes the form `bucketCodeLambda-<scope>` where scope is the context variable named `scope` when deploying the lambda.

## Destruction :boom:

> [!WARNING]
> To prevent accidental execution of the lambda and to prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

```console
cdk destroy -c scope=<scope> -c bucketArn="<bucketArn>" -c objectKey=<objectKey>
```

### Git Bash on Windows

```console
winpty cdk.cmd destroy -c scope=<scope> -c bucketArn="<bucketArn>" -c objectKey=<objectKey>
```

Also destroy the S3 bucket by following the instructions in [private S3 bucket](../deploy-s3-private-bucket/README.md#deployment)
