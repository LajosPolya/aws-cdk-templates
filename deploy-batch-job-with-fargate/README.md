# Deploy Batch Job with ECS Fargate

This CDK app deploys a Batch Job with an ECS Fargate Job.

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
cdk deploy -c ecrName=<ecr_Name> -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd deploy -c ecrName=<ecr_Name> -c scope=<scope>
```

- `ecrName` represents the name of the Elastic Container Repository containing the image to run on the ECS Fargate tasks. Follow the instructions in [deploy-ecr](../deploy-ecr/README.md) to deploy an image of a simple API to an AWS Elastic Container Repository

This deploys a Batch Job with a Fargate Task. The Batch Job can be submitted with the following command. Both `jobQueue` and `jobDefinition` are exported by the CDK and therefore printed to the command line when the app is deployed. The job prints `Hello World from Batch Job` to the logs.

```console
aws batch submit-job --job-name batch-job --job-queue <jobQueue> --job-definition <jobDefinition>
```

## Destruction :boom:

### \*nix/Mac

```console
cdk destroy -c ecrName=<ecr_Name> -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd destroy -c ecrName=<ecr_Name> -c scope=<scope>
```
