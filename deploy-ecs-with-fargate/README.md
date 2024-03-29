# Deploy ECS with Fargate

This CDK app deploys a Fargate instance within an ECS Cluster.

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

`cdk deploy -c ecrName=<ecr_Name> -c tag=<image_tag> -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd deploy -c ecrName=<ecr_Name> -c tag=<image_tag> -c scope=<scope>`

- `ecrName` represents the name of the Elastic Container Repository containing the image to run on the ECS Fargate tasks. Follow the instructions in [deploy-ecr](../deploy-ecr/README.md) to deploy an image of a simple API to an AWS Elastic Container Repository

The app will set the environment (account and region) based on the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

If deploying [micronaut-api](../api/README.md) then once deployed you may access the `/health` endpoint by either the public IP `http://<public_ip>:8080/health` or the public DNS `http://<public_dns>:8080/health`. The server can be tested for connectivity using the following list of commands.

```Bash
CLUSTER_ARN=<clusterArn>
TASK_ARN=$(aws ecs list-tasks --cluster $CLUSTER_ARN --query "taskArns[0]" --output text)
ENI=$(aws ecs describe-tasks --tasks $TASK_ARN --cluster $CLUSTER_ARN --query "tasks[0].attachments[0].details[1].value" --output text)
TASK_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI --query 'NetworkInterfaces[0].Association.PublicIp' --output text)

curl -I --location 'http://'"$TASK_IP"':8080/health'
```

`clusterArn` is the ARN of the ECS Cluster which is exported by the CDK and therefore printed to the CLI when the app is deployed. This list of commands should output the response status `204`.

## Destruction :boom:

> **Warning** The compute instance(s) deployed by this app is/are open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c ecrName=<ecr_Name> -c tag=<image_tag> -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c ecrName=<ecr_Name> -c tag=<image_tag> -c scope=<scope>`
