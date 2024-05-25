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

## Push image to ECR

Reference: https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html

Have a docker image ready. One can be created by following the instruction in [api](../api/README.md)

```Bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com
docker tag <image_name>:<image_tag> <repo_url>:<image_tag>
docker push <repo_url>:<image_tag>
```

Where `<repo_url>` is the URL the the newly deployed repository. The Repo URL is exported by the CDK and therefore printed to the CLI at the end of the deployment.

## Destruction :boom:

### \*nix/Mac

`cdk destroy -c repoName=<repo_name>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c repoName=<repo_name>`
