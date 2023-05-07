# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


If deploying [micronaut-api](../api/README.md) then once deployed you may access the `/health` endpoint by either the public IP `http://<public_ip>:8080/health` or the public DNS `http://<public_dns>:8080/health` which can be found in AWS Console -> Amazon Elastic Container Service -> Clusers -> cluser_name -> Tasks -> task_name -> ENI ID -> Public IPv4 address or Public IPv4 DNS respectively.
