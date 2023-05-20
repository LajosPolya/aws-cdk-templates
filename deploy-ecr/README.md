# Welcome to your CDK TypeScript project

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npm run check` checks if files are formatted
- `npm run format` formats files
- `cdk deploy -c repoName=<repo_name>` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Deployment

`cdk deploy -c repoName=<repo_name>`

The app will set the environment (account and region) based on the the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the defualt AWS CLI configurations, more information can be (here)[https://docs.aws.amazon.com/cdk/v2/guide/environments.html]. The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

## Push image to ECR

Reference: https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html
a
Have a docker image ready. One can be create by following the instruction in [api](../api/README.md)

`aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com`
`docker tag <docker_image_id> <aws_account_id>.dkr.ecr.<region>.amazonaws.com/<repo_name>:<new_tag_name>`
`docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/<repo_name>:<new_tag_name>`
