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

```Bash
aws ecs run-task --task-definition ecsFargateStandalone-<scope> --cluster ecsFargateStandalone-<scope> --network-configuration "awsvpcConfiguration={subnets=['<subnetId>'],securityGroups=['<securityGroupId>']}" --launch-type FARGATE
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
