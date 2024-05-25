# Deploy VPC

This CDK app deploys a VPC with three subnets.

1. Public Subnet routed to public internet via Internet Gateway
2. Private with Egress Subnet routed to the public internet via NAT Gateway.
3. Private Isolated Subnet not routed to the internet.

Each subnet has an EC2 instance deployed to it. The purpose of this application is to deploy an L2 VPC and all of its necessary components (subnets, internet gateway, NAT gateway, route tables, etc) as a tool
to learn about newtorking in AWS.

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

This deploys a VPC with three subnets; a Public Subnet which allows inbound and outbound connections to the public internet, a Private Subnet with Egress which only allows outbound connections to the
public internet, and a Private Isolated Subnet which is only accessible from within the VPC.

Then it deploys an EC2 instance into each subnet. The EC2 instances within the Public Subnet and the Private with Egress Subnet have an HTTP server installed on them. The EC2 instance within the Private Isolated Subnet doesn't have an HTTP server installed on it because it cannot access the internet an therefore can't download and install any external software.

## Testing EC2 Instance Connectivity

Each EC2 instance has a public IP and a private IP which will be used to make requests to the HTTP servers. The IPs are exported by the CDK and therefore printed to the CLI when the EC2 instances are deployed.

### Test 1: Accessibility from public internet

1. Verify access to the EC2 instance in the Public Subnet via public IP

`curl <publicInstancePublicIp>`

2. Verify no access to the EC2 instance in the Private with Egress Subnet via public IP

`curl <privateEgressInstancePrivateIp>`

3. Verify no access the EC2 instance in the private isolate subnet via public IP

`curl <privateIsolatedInstancePrivateIp>`

The EC2 instance within the Public Subnet is the only instance accessible by the public internet because the Public Subnet is the only subnet routed to the Internet Gateway. The Internet Gateway is the component which allows two way communication between a VPC and the public internet.

### Test 2: Accessibility from within the VPC

Login to the AWS Console and find the EC2 instance within the Public Subnet and connect to it via EC2 Instance Connect (click the connect button on the EC2 instance's page).

1. Verify the public EC2 instance has access to the EC2 instance within the Private with Egress Subnet via private IP

`curl <privateEgressInstancePrivateIp>`

2. Verify the public EC2 instance **cannot** `curl` the EC2 instance within the Private Isolated Subnet via private IP

`curl <privateIsolatedInstancePrivateIp>`

3. Verify the public EC2 instance can `ping` the EC2 instance within the Private Isolated Subnet via private IP

`ping <privateIsolatedInstancePrivateIp>`

This test proves that the EC2 instances are able to communiate within the VPC by their private IPs. Then why did the first `curl` command succeed but the second fail? The `curl` command to the EC2 instance within the Private with Egress Subnet succeeded because that subnet is routed to a NAT Gateway which allows the EC2 instance to make outbound connections to the public internet allowing it to download and install an HTTP server. The `curl` command to the EC2 instance within the Private Isolated Subnet falied because that subnet is not routed to the public internet so it can't download the HTTP server. The `ping` command succeeded proving that the EC2 instances are able to communicate.

## Destruction :boom:

> **Warning** One of the compute instances deployed by this app is open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope>`
