# Deploy VPC to VPC via Peering Connection

This CDK app deploys two VPCs and connects their networks using a Peering Connection.

1. Deploy an EC2 Instance within the Main VPC with a Public Subnet routed to public internet via Internet Gateway
2. Deploy an EC2 Instance within the Peered VPC B with a Private with Egress Subnet only routed to the internet via NAT Gateway
3. Connect the two VPCs with a Peering Connection
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

The EC2 instance within the Main VPC has a Public IP which will be used to make requests to the HTTP server. The EC2 instance within the Peered VPC only has a Private IP. The IPs are exported by the CDK and therefore printed to the CLI when the EC2 instances are deployed.

### Test 1: Accessibility from public internet

1. Verify access to the EC2 instance in the Main VPC via public IP

`curl <publicIpMainVpcInstance>`

2. Verify no access to the EC2 instance in peered VPC via private IP

`curl <privateIpPeeredInstance>`

The EC2 instance within the Public Subnet is the only instance accessible by the public internet because the Public Subnet is the only subnet routed to the Internet Gateway. The Internet Gateway is the component which allows two way communication between a VPC and the public internet. The output of the EC2 instance in the Main VPC indicates that it made a response to the EC2 Instance in the Peered VPC via Peered Connetion. 

> [!NOTE]
> If the response isn't successful then wait a minutes and try again because the EC2 instance may not be initialized.

### Test 2: Accessibility from within the VPC

Login to the AWS Console and find the EC2 instance within VPC A and connect to it via EC2 Instance Connect (click the connect button on the EC2 instance's page).

1. Verify the EC2 instance within the Main VPC has access to the EC2 instance within the Peered VPC via private IP

`curl <privateIpPeeredInstance>`

This test proves that the EC2 instances are able to communiate across VPCs using the Peering Connection.

## Destruction :boom:

> [!WARNING]
> One of the compute instances deployed by this app is open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope>`
