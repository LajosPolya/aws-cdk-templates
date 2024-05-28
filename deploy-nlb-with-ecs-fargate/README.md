# Deploy Network Load Balancer with ECS Fargate

This CDK app deploys a Network Load Balancer whose target is a set of ECS Fargate tasks.

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
cdk deploy -c ecrName=<ecr_Name> -c tag=<image_tag> -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd deploy -c ecrName=<ecr_Name> -c tag=<image_tag> -c scope=<scope>
```

- `ecrName` represents the name of the Elastic Container Repository containing the image to run on the ECS Fargate tasks. Follow the instructions in [deploy-ecr](../deploy-ecr/README.md) to deploy an image of a simple API to an AWS Elastic Container Repository

This deploys a Network Load Balancer which can be used to communicate with an HTTP server on two ECS Fargate tasks. If deploying [micronaut-api](../api/README.md) then once deployed you may access the `/health` endpoint by the Network Load Balancer's public DNS which is exported by the CDK and therefore printed to the CLI when the app is deployed.

> [!NOTE]
> After the deployment completes the NLB may take a few extra minutes to come online.

### cURL :curling_stone:

```console
curl --location 'http://<nlb_dns>:80/health'
```

### Browser :surfer:

If the DNS doesn't work then verify that the browser is using `http://` and not `https://`. For example, `http://<dns>/health`.

## Destruction :boom:

> [!WARNING]
> The compute instances deployed by this app are open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

```console
cdk destroy -c ecrName=<ecr_Name> -c tag=<image_tag> -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd destroy -c ecrName=<ecr_Name> -c tag=<image_tag> -c scope=<scope>
```
