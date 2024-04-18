# Deploy two VPCs with an Overlapping CIDR and Connect them

This CDK app deploys two VPCs with an overlapping CIDR and connects their networks using a Private NAT Gateway, Transit Gateway, and an ALB. This deployer attempts to deploy the ["Enable communication between overlapping networks"](https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-scenarios.html#private-nat-overlapping-networks) AWS example but it ultimately became much more complicated in order to allow users to connect to the EC2 instances and verify results.

1. Deploy the two VPCs (VPC A and VPC B, each of these VPCs will have two disjoint CIDRs)
2. Within each VPC deploy a Non-Routable Subnet. These subnets have the same CIDR
3. Within each Non-Routable Subnet deploy an EC2 instance. The goal of this deployer is to allow the EC2 instance in VPC A to make a request to the EC2 instance in VPC B.
4. In each VPC deploy two Routable Subnets. These subnets' CIDRs must not intersect with any other subnet.
5. Deploy a Private NAT Gateway within the Routable Subnet of VPC A. This Private NAT Gateway will be used to route traffic from the Non-Routable Subnet of VPC A to the Transit Gateway.
6. Deploy a Transit Gateway to connect the two VPCs.
7. Deploy an ALB in the Routable Subnet of VPC B. The ALB will route Traffic from the Transit Gateway to the EC2 instance in the Non-Routable Subnet of VPC B.
8. Update the Route Tables/Transit Gateway Route Tables to route traffic from `EC2 instance in Non-Routable Subnet of VPC A` -> `Private NAT Gateway in Routable Subnet of VPC A` -> `Transit Gateway` -> `ALB in Routable Subnet of VPC B` -> `EC2 instance in Non-Routalbe Subnet of VPC B`.

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

This deploys two VPCs each having a Non-Routable Subnet with both subnets having the same CIDR. Normally traffic wouldn't be able to flow between these two subnets but with the help of a Private NAT Gateway, Transit Gateway, and ALB this is made possible. This deployer also deploys a couple Public NAT Gateways and an Internet Gateway in order to allow the EC2 instances to download HTTP servers and to allow the user to connect to one of the EC2 instances. A third EC2 instance is deploy which is used by users to connect to the EC2 instance within the Non-Routable Subnet of VPC A.

### Test 1: Accessibility from within the VPC

Login to the AWS Console and find the Public EC2 instance within VPC A and connect to it via EC2 Instance Connect (click the connect button on the EC2 instance's page).

1. Verify the Non-Routable EC2 instance in VPC A has access to the Non-Routable EC2 instance within VPC B via private IP.

`curl <nonRoutableEc2VpcAPrivateIp>`

This test proves that the EC2 instances are able to communiate across VPCs even when the two Non-Routable Subnets have the same CIDR. How does this prove that the EC2 instances are able to communicate? `curl <nonRoutableEc2VpcAPrivateIp>` makes a request to the Non-Routable EC2 instance in VPC A. That instance makes a request to the Non-Routable EC2 instance using the ALBs DNS. To be more specific, the traffic is routed from `the EC2 instance in the Non-Routable Subnet of VPC A` to ` the Private NAT Gateway in the Routable Subnet of VPC A` to `the Transit Gateway` to `the ALB in Routable Subnet of VPC B` to ` the EC2 instance in Non-Routalbe Subnet of VPC B`.

## Destruction :boom:

> **Warning** One of the compute instances deployed by this app is open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope>`
