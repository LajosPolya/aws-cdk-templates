# Deploy API Gateway HTTP API with Network Load Balancer Integration

This CDK app deploys an API Gateway HTTP API backed by a Network Load Balancer.

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

This deploys an API Gateway HTTP API backed by NLB. This API is backed by an AWS NLB and can be accessed by the API's URL which is exported by the CDK and therefore printed to the CLI when the app is deployed.

### cURL :curling_stone:

The NLB can be accessed by the `nlb` endpoint.

`curl <api_url>/nlb`

> [!NOTE]
> After the deployment completes the NLB may take a few extra minutes to come online.

### Browser :surfer:

The API will respond successfully if the URL is pasted into the browser.

## Destruction :boom:

> [!WARNING]
> The API Gateway deployed by this app is open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope>`

Leave note about how it may take a couple of minutes for NLB to be usable by VPC Link
