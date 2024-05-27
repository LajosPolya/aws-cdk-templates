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

This app contains multiple stacks and therefore will take multiple steps to deploy.

### Build the Docker Image

Follow the [API instructions](../api/README.md) to build a Docker Image of the API. Remember the value of `image_name` and `image_tag`.

### Deploy the Elastic Container Registry

#### \*nix/Mac

`cdk deploy DeployEcrStack -c scope=<scope> -c tag=<image_tag>`

#### Git Bash on Windows

`winpty cdk.cmd deploy DeployEcrStack -c scope=<scope> -c tag=<image_tag>`

Where `image_tag` is the tag of the Docker Image built in the previous step.

### Push the Docker Image to ECR

Reference: https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html

```Bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com
docker tag <image_name>:<image_tag> <repoUriForTag>
docker push <repoUriForTag>
```

Where `repoUriForTag` is the URI of the AWS ECR Repository, this value is exported by the CDK and therefore printed to the CLI during the deployment.

### Deploy the ECS Fargate Task

#### \*nix/Mac

`cdk deploy DeployEcsWithFargateStack -c scope=<scope> -c tag=<image_tag>`

#### Git Bash on Windows

`winpty cdk.cmd deploy DeployEcsWithFargateStack -c scope=<scope> -c tag=<image_tag>`

```Bash
CLUSTER_ARN=<clusterArn>
TASK_ARN=$(aws ecs list-tasks --cluster $CLUSTER_ARN --query "taskArns[0]" --output text)
ENI=$(aws ecs describe-tasks --tasks $TASK_ARN --cluster $CLUSTER_ARN --query "tasks[0].attachments[0].details[1].value" --output text)
TASK_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI --query 'NetworkInterfaces[0].Association.PublicIp' --output text)

# This command assumes the Micronaut API from `../api` was deployed
curl -I --location 'http://'"$TASK_IP"':8080/health'
```

`clusterArn` is the ARN of the ECS Cluster which is exported by the CDK and therefore printed to the CLI when the app is deployed. This list of commands should output the response status `204`.

## Destruction :boom:

> [!WARNING]
> The compute instance(s) deployed by this app is/are open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope> -c tag=<image_tag> --all`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope> -c tag=<image_tag> --all`
