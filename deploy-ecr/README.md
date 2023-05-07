# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy -c repoName=<repo_name> -c account=<account> -c region=<region>`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


## Push image to ECR
Reference: https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html
a
Have a docker image ready. One can be create by following the instruction in [api](../api/README.md)

 `aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com`
 `docker tag <docker_image_id> <aws_account_id>.dkr.ecr.<region>.amazonaws.com/<repo_name>:<new_tag_name>`
 `docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/<repo_name>:<new_tag_name>`