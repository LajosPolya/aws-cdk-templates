# Deploy ECS with Fargate from Standalone Task

This CDK app deploys an ECS Fargate Standalone Task. The task is said to be standalone because it doesn't live inside of an ECS Service. The benefit of this is that once the task is finished and terminated it is not automatically rebooted by a Service. This sort of standalone task is useful for executing one of jobs.

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

This app deploys an ECS Task with the task definition container from the [batch-job example](../batch-job-script/), before deploying this CDK app build the batch job following the instructions in the README. Verify that Docker is running. To execute an instance of the Task run the following command:

### Running an instance of the ECS Task

The following commands run an instance of the standalone ECS task, wait until the task is up an running, then finally, tail the logs of the task. A success is indicated if the the phrase `Hello World from Batch Job` is present in the logs. Note that this standalone ECS task isn't a batch job but this example uses the same Docker image as the batch job example.

#### \*nix/Mac

```Bash
aws ecs run-task --task-definition ecsFargateStandalone-<scope> --cluster ecsFargateStandalone-<scope> --network-configuration "awsvpcConfiguration={subnets=['<subnetId>'],securityGroups=['<securityGroupId>']}" --launch-type FARGATE

CLUSTER_ARN=arn:aws:ecs:us-east-2:318123377634:cluster/ecsFargateStandalone-<scope>
TASK_ARN=$(aws ecs list-tasks --cluster $CLUSTER_ARN --query "taskArns[0]" --output text)

aws ecs wait tasks-running --cluster $CLUSTER_ARN --tasks "$TASK_ARN"

aws logs tail "/ecs-with-fargate-standalone/<scope>"
```

`scope` is the CDK applications scope chosen by the user.
`subnetId` is the Private Subnet's id, this is the subnet the task will be executed in.
`securityGroupId` is the Security Group which will be attached to the task.

#### Windows

```Bash
aws ecs run-task --task-definition ecsFargateStandalone-<scope> --cluster ecsFargateStandalone-<scope> --network-configuration "awsvpcConfiguration={subnets=['<subnetId>'],securityGroups=['<securityGroupId>']}" --launch-type FARGATE

CLUSTER_ARN=arn:aws:ecs:us-east-2:318123377634:cluster/ecsFargateStandalone-<scope>
TASK_ARN=$(aws ecs list-tasks --cluster $CLUSTER_ARN --query "taskArns[0]" --output text)

aws ecs wait tasks-running --cluster $CLUSTER_ARN --tasks "$TASK_ARN"

MSYS_NO_PATHCONV=1 aws logs tail "/ecs-with-fargate-standalone/<scope>"
```

`scope` is the CDK applications scope chosen by the user.
`subnetId` is the Private Subnet's id, this is the subnet the task will be executed in.
`securityGroupId` is the Security Group which will be attached to the task.

## Destruction :boom:

> [!WARNING]
> To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

```console
cdk destroy -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd destroy -c scope=<scope>
```
