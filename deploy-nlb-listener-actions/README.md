# Deploy Network Load Balancer with Listener Actions

This CDK app deploys a Network Load Balancer whose target is a set of EC2 instances. This deployer also deploys custom listeners which forward traffic to specific a EC2 isntance depending on the port the traffic is transported through.

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

This deploys a Network Load Balancer which can be used to communicate with an HTTP server on two EC2 instances. The server can be accessed by the Network Load Balancer's public DNS which is exported by the CDK and therefore printed to the CLI when the app is deployed. Port 80 on the Network Load Balancer forwards the request to one of both instances, while ports 81 and 82 forward the request to the first and second EC2 instance respectively.

### Browser :surfer:

If the DNS doesn't work then verify that the browser is using `http://` and not `https://`. For example, `http://<dns>/`.

### cURL :curling_stone:

`curl http://<nlb_dns>:80` -> Contacts one of the two EC2 instances

`curl http://<nlb_dns>:81` -> Contacts the first EC2 instance

`curl http://<nlb_dns>:82` -> Contacts the second EC2 instance

> [!NOTE]
> The NLB may not respond right away. If that's the case wait a couple minutes and try again.

## Destruction :boom:

> **Warning** The compute instances deployed by this app are open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope>`
