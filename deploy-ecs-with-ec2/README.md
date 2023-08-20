# Deploy ECS with EC2

This CDK app deploys an EC2 Insance within an ECS Cluster.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npm run check` checks if files are formatted
- `npm run format` formats files
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Deployment

### *nix/Mac

`cdk deploy -c ecrName=<ecr_Name> -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd deploy -c ecrName=<ecr_Name> -c scope=<scope>`

The app will set the environment (account and region) based on the the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

If deploying [micronaut-api](../api/README.md) then once deployed you may access the `/health` endpoint by either the public IP `http://<public_ip>:8080/health` or the public DNS `http://<public_dns>:8080/health` which can be found in AWS Console -> Amazon Elastic Container Service -> Clusters -> cluser_name -> Infrastructure -> Container instance -> container_instance_id -> Public IP or Public DNS respectively.

> **Warning** The compute instance(s) deployed by this app is/are open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### *nix/Mac

`cdk destroy -c ecrName=<ecr_Name> -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c ecrName=<ecr_Name> -c scope=<scope>`
