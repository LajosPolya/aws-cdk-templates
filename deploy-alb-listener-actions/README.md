# Deploy Application Load Balancer with Listener Actions

This CDK app deploys an Application Load Balancer whose target is a set of EC2 instances. This deployer also deploys custom listeners which forward traffic to specific a EC2 isntance depending on the port the traffic is transported through.

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

This deploys an Application Load Balancer which can be used to communicate with an HTTP server on two EC2 instances. The server can be accessed by the Application Load Balancer's public DNS name which is exported by the CDK and therefore printed to the CLI when the app is deployed.

### cURL :curling_stone:

`curl <albDnsName>` -> Contacts one of the two EC2 instances

`curl <albDnsName>/fixedResponse` -> Responds with `"This is a fixed response"`

`curl --location <albDnsName>?redirect=true` -> Redirects the request to the first EC2 instance

`curl <albDnsName>:81` -> Contacts the first EC2 instance

`curl <albDnsName>:82` -> Contacts the second EC2 instance

### Browser :surfer:

If the DNS name doesn't work then verify that the browser is using `http://` and not `https://`. For example, `http://<albDnsName>`.

## Destruction :boom:

> [!WARNING]
> The compute instances deployed by this app are open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

```console
cdk destroy -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd destroy -c scope=<scope>
```
