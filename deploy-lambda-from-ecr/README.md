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

This CDK application contains two CDK stacks and therefore will take multiple steps to deploy.

### Build the Lambda handler

Follow the instructions in [lambda-handler](../lambda-handler/README.md#Build-Docker-Container) to build Docker image of the Lambda handler's code. Remeber to save `<image_name>` and `<image_tag>` for later.

### Deploy the ECR repository

From this directory, run the following commands.

#### \*nix/Mac

`cdk deploy DeployEcrStack -c scope=<scope> -c repoName=<repo_name> -c tag=<image_tag>`

#### Git Bash on Windows

`winpty cdk.cmd deploy DeployEcrStack -c scope=<scope> -c repoName="<repo_name>" -c tag=<image_tag>`

Where `repo_name` represents the name of deployed ECR repository and `image_tag` represents the tag of the docker image built in the previous step. Note, `image_tag` isn't used in the deployment of this stack but it's still a required parameter.

The ECR repository's URI is exported by the CDK and therefore printed to the CLI. In the following steps replace the `ecr_repo_uri` variable with the exported URI.

### Push Docker Image to the ECR repository

```Bash
aws ecr get-login-password --region <aws_region> | docker login --username AWS --password-stdin <ecr_repo_uri>

docker tag <image_name>:<image_tag> <ecr_repo_uri>:<image_tag>

docker push <ecr_repo_uri>:<image_tag>
```

### Deploy the Lambda

#### \*nix/Mac

`cdk deploy DeployLambdaFromEcrStack -c scope=<scope> -c repoName=<repo_name> -c tag=<image_tag>`

#### Git Bash on Windows

`winpty cdk.cmd deploy DeployLambdaFromEcrStack -c scope=<scope> -c repoName="<repo_name>" -c tag=<image_tag>`

This deploys a Lambda which when invoked will return a JSON string.

To invoke the lambda via CLI execute the following command:

`aws lambda invoke --function-name=<lambdaFunctionName> outfile.txt`

Where `lambdaFunctionName` represents the Lambda function's name. The name of the function is exported by the CDK and therefore printed to the CLI. View the contents of `outfile.txt` to explore the Lambda's response.

## Destruction :boom:

> **Warning** To prevent accidental execution of the lambda and to prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope> -c repoName=<repo_name> -c tag=<image_tag> --all`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope> -c repoName=<repo_name> -c tag=<image_tag> --all`
