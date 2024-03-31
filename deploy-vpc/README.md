# Deploy VPC

This CDK app deploys a VPC with three subnets.

1. Public Subnet routed to public internet via Internet Gateway
2. Private with Egress Subnet routed to the public internet via NAT Gateway.
3. Private Isolated Subnet not routed to the internet.

Each subnet has an EC2 instance deployed to it. The purpose of this application is to deploy a VPC and all of its necessary parts (subnets, internet gateway, NAT gateway, route tables, etc) as a tool
to learn more about netorking in AWS.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run check` checks if files are formatted
- `npm run format` formats files
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Deployment :rocket:

This CDK application contains two CDK stacks and therefore will take multiple steps to deploy.

### Deploy the VPC and the Rest of the Networking Infrastructure

#### \*nix/Mac

`cdk deploy DeployVpcStack -c scope=<scope> -c vpcTag=<vpc_tag>`

#### Git Bash on Windows

`winpty cdk.cmd deploy DeployVpcStack -c scope=<scope> -c vpcTag=<vpc_tag>`

Where `<vpc_tag>` is a tag assigned to the VPC. This tag is also used to query for the VPC and therefore should be unique to each deployed VPC.

### Deploy the EC2 Instances

#### \*nix/Mac

`cdk deploy DeployEc2Stack -c scope=<scope> -c vpcTag=<vpc_tag>`

#### Git Bash on Windows

`winpty cdk.cmd deploy DeployEc2Stack -c scope=<scope> -c vpcTag=<vpc_tag>`

The app will set the environment (account and region) based on the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

The first stack deploys a VPC with three subnets; a Public Subnet which allows inbound and outbound connections to the public internet, a private subnet with egress which only allows outbound connections to the
public internet, and a Private Isolated Subnet which can only be accessible from within the VPC.

The second stack deploys an EC2 instance into each subnet. The EC2 instances within the Public Subnet and the Private with Egress Subnet have an HTTP server installed on them. The EC2 instance within the Private Isolated Subnet doesn't have an HTTP server installed on it because it cannot access the internet an therefore can't install any external software.

### Testing EC2 Instance Connectivity

Each EC2 instance has a public IP and a private IP which will be used to make requests to the HTTP servers. The IPs are exported by the CDK and therefore printed to the CLI when the EC2 instances are deployed.

#### Test 1: Accessibility from public internet

1. Verify access to the EC2 instance in the Public Subnet via public IP

`curl publicInstancePublicIp`

2. Verify no access to the EC2 instance in the Private with Egress Subnet via public IP

`curl privateEgressInstancePublicIp`

3. Verify no access the EC2 instance in the private isolate subnet via public IP

`curl privateIsolatedInstancePublicIp`

The EC2 instance within the Public Subnet is the only instance accessible by the public internet because the Public Subnet is the only subnet routed to the Internet Gateway. The Internet Gateway is the component which allows two way communication between a VPC and the public internet.

#### Test 2: Accessibility from within the VPC

Login to the AWS Console and find the EC2 instance within the Public Subnet and connect to it via EC2 Instance Connect (click the connect button on the EC2 instances page).

1. Verify the public EC2 instance has access to the EC2 instance within the Private with Egress Subnet via private IP

`curl privateEgressInstancePrivateIp`

2. Verify the public EC2 instance _cannot_ `curl` the EC2 instance within the Private Isolated Subnet via private IP

`curl privateIsolatedInstancePrivateIp`

3. Verify the public EC2 instance can `ping` the EC2 instance within the Private Isolated Subnet via private IP

`ping privateIsolatedInstancePrivateIp`

This test proves that the EC2 instances are able to communiate within the VPC by their private IPs. Then why did the first `curl` command succeed but the second fail? The `curl` command to the EC2 instance within the Private with Egress Subnet passed because that subnet is routed to a NAT Gateway which allows the EC2 instance to make outbound connections to the public internet allowing it to download and install an HTTP server. The `curl` command to the EC2 instance within the Private Isolated Subnet falied because that subnet is not routed to the public internet so it can't download the HTTP server, but the `ping` command succeeds proving that the EC2 instances are able to communicate.

## Destruction :boom:

> **Warning** One of the compute instances deployed by this app is open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope> -c vpcTag=<vpc_tag> --all`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope> -c vpcTag=<vpc_tag> --all`
