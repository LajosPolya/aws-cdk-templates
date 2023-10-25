# Deploy EC2 Instance

This CDK app deploys an EC2 Instance with an HTTP server that is open to the public internet.

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

`cdk deploy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd deploy -c scope=<scope>`

The app will set the environment (account and region) based on the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

This deploys an HTTP server on an EC2 instance. The server can be accessed by either the public IP or the public DNS which are both exported by the CDK and therefore printed to the CLI when the app is deployed.

### Command Line

`curl --location 'http://<publicDnsName>'` or `curl --location 'http://<publicIp>'`

### Browser :surfer:

If the IP address or DNS doesn't work then verify that the browser is using `http://` and not `https://`. For example, `http://<ip_address>/` or `http://<dns>/`.

## Destruction :boom:

> **Warning** The compute instance deployed by this app is open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope>`
