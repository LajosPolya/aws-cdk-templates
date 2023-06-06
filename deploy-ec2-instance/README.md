# Deploy EC2 Instance

This CDK app deploys an EC2 Instance with an HTTP server that is open to the public internet.

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

`cdk deploy scope=<scope>`

The app will set the environment (account and region) based on the the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

This deploys an HTTP server on an EC2 instance. The server can be accessed by either the public IP or the public DNS which can be found in AWS Console -> EC2 -> Instances (running) -> instance_id0 -> Auto-assigned IP address or Public IPv4 DNS respectively.
If the IP address or DNS doesn't work then verify that the browser is using `http://` and not `https://`. For example, `http://<ip_address>/` or `http://<dns>/`.

Currently this will only work in us-east-2 because of a bug: https://github.com/aws/aws-cdk/issues/21690

> **Warning** The compute instance deployed by this app is open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

`cdk destroy scope=<scope>`
