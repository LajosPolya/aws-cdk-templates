# Deploy ECR

This CDK app deploys an AWS Elastic Container Repository to store docker images.

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

`cdk deploy -c repoName=<repo_name>`

### Git Bash on Windows

`winpty cdk.cmd deploy -c repoName=<repo_name>`

The app will set the environment (account and region) based on the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

## Push image to ECR

Reference: https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html

Have a docker image ready. One can be created by following the instruction in [api](../api/README.md)

```Bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com
docker tag <docker_image_id> <aws_account_id>.dkr.ecr.<region>.amazonaws.com/<repo_name>:<new_tag_name>
docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/<repo_name>:<new_tag_name>
```

## Destruction :boom:

### \*nix/Mac

`cdk destroy -c repoName=<repo_name>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c repoName=<repo_name>`
