# Deploy Network Load Balancer with Listener Actions

This CDK app deploys a Network Load Balancer whose target is an Application Load Balancer who has one EC2 target.

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

This deploys a Network Load Balancer which can be used to communicate with an Application Load Balancer which communicates with an HTTP server on an EC2 instance. The server can be accessed by the Network Load Balancer's public DNS which is exported by the CDK and therefore printed to the CLI when the app is deployed.

> **Warning** After the deployment completes the NLB may take a few extra minutes to come online.

### Browser :surfer:

If the DNS doesn't work then verify that the browser is using `http://` and not `https://`. For example, `http://<dns>/`.

### cURL :curling_stone:

`curl <nlb_dns>` -> Contacts one of the two EC2 instances

Where `nlb_dns` is the DNS of the NLB. This value out exported by the CDK and therefore printed to the CLI after a deployment.

Note that the NLB may not respond right away. If that's the case wait a couple minutes and try again.

## Destruction :boom:

> [!WARNING]
> The compute instances deployed by this app are open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope>`
