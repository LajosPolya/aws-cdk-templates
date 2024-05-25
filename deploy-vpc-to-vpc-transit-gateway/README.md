# Deploy VPC to VPC Connection via Transit Gateway

This CDK app deploys two VPCs and connects their networks using a Transit Gateway.

1. Deploy an EC2 Instance within VPC A with a Public Subnet routed to public internet via Internet Gateway
2. Deploy an EC2 Instance within VPC B with a Private Isolated Subnet not routed to the internet
3. Deploy a Transit Gateway to allow a connection between VPC A and VPC B
4. Verify that the EC2 Instance within VPC A can ping the EC2 Instance within VPC B

The purpose of this application is to deploy two VPCs and allow them to communicate via Transit Gateway.

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

This deploys two VPCs; the first VPC (A) contains a Public Subnet with an EC2 Instance deployed into it. The second VPC (B) contains a Private Isolated Subnet with an EC2 Instance deployed into it. The Public Subnet allows inbound and outbound traffic from the Public Internet. The Private Subnet should only allow traffic from within the VPC but deploying a Transit Gateway will also allow VPC A to open a connection with VPC B.

## Testing EC2 Instance Connectivity

The EC2 instance within VPC A has a Public IP which will be used to make requests to the HTTP servers. The EC2 instance within VPC B only has a Private IP. The IPs are exported by the CDK and therefore printed to the CLI when the EC2 instances are deployed.

### Test 1: Accessibility from public internet

1. Verify access to the EC2 instance in VPC A via public IP

`curl <publicInstancePublicIp>`

2. Verify no access to the EC2 instance in VPC B via private IP

`curl <privateInstancePrivateIp>`

The EC2 instance within the Public Subnet is the only instance accessible by the public internet because the Public Subnet is the only subnet routed to the Internet Gateway. The Internet Gateway is the component which allows two way communication between a VPC and the public internet.

### Test 2: Accessibility from within the VPC

Login to the AWS Console and find the EC2 instance within VPC A and connect to it via EC2 Instance Connect (click the connect button on the EC2 instance's page).

1. Verify the EC2 instance within VPC A has access to the EC2 instance within VPC B via private IP

`ping <privateInstancePrivateIp>`

This test proves that the EC2 instances are able to communiate across VPCs using the Transit Gateway.

## Destruction :boom:

> **Warning** One of the compute instances deployed by this app is open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope>`
