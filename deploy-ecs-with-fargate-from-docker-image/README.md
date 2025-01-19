# Deploy ECS with Fargate from local Docker Image

This CDK app deploys a local Docker Image to Fargate within an ECS Cluster.

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

```console
cdk deploy -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd deploy -c scope=<scope>
```

This app deploys [micronaut-api](../api/README.md), before deploying this CDK app build the Micronaut API following the instructions in the README. Verify that Docker is running.

```Bash
CLUSTER_ARN=<clusterArn>
TASK_ARN=$(aws ecs list-tasks --cluster $CLUSTER_ARN --query "taskArns[0]" --output text)
ENI=$(aws ecs describe-tasks --tasks $TASK_ARN --cluster $CLUSTER_ARN --query "tasks[0].attachments[0].details[1].value" --output text)
TASK_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI --query 'NetworkInterfaces[0].Association.PublicIp' --output text)

curl -I --location 'http://'"$TASK_IP"':8080/health'
```

`clusterArn` is the ARN of the ECS Cluster which is exported by the CDK and therefore printed to the CLI when the app is deployed. This list of commands should output the response status `204`.

## Destruction :boom:

> [!WARNING]
> The compute instance(s) deployed by this app is/are open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

```console
cdk destroy -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd destroy -c scope=<scope>
```
