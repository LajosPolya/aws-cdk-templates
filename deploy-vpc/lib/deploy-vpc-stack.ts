import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployVpcStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployVpcStack extends cdk.Stack {
  vpcL1: cdk.aws_ec2.CfnVPC;
  privateSubnet: cdk.aws_ec2.CfnSubnet;
  publicSubnet: cdk.aws_ec2.CfnSubnet;

  constructor(scope: Construct, id: string, props: DeployVpcStackProps) {
    super(scope, id, props);

    const testingTag = new cdk.Tag("test", "testTag", { priority: 1000 });
    const scopeTag = new cdk.Tag(props.scope, props.scope, { priority: 1000 });
    const oneTag = new cdk.Tag("45", "45", { priority: 1000 });

    this.vpcL1 = new cdk.aws_ec2.CfnVPC(this, "vpc", {
      cidrBlock: "172.31.0.0/16",
      // TODO: should I just stick to IP addresses instead of DNS support?
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: [testingTag, scopeTag, oneTag],
    });

    // This isn't deployed to an availability zone, what does that mean?
    this.publicSubnet = new cdk.aws_ec2.CfnSubnet(this, "publicSubnet", {
      // availabilityZone: 'us-east-1',
      cidrBlock: "172.31.0.0/20",
      mapPublicIpOnLaunch: true,
      tags: [testingTag, scopeTag],
      vpcId: this.vpcL1.attrVpcId,
      availabilityZone: "us-east-2a",
    });

    const internetGateway = new cdk.aws_ec2.CfnInternetGateway(
      this,
      "internetGateway",
      {
        tags: [testingTag, scopeTag],
      },
    );

    const vpcGatewayAttachment = new cdk.aws_ec2.CfnVPCGatewayAttachment(
      this,
      "gatewayAttachment",
      {
        internetGatewayId: internetGateway.attrInternetGatewayId,
        vpcId: this.vpcL1.attrVpcId,
      },
    );

    const publicRouteTable = new cdk.aws_ec2.CfnRouteTable(
      this,
      "publicRouteTable",
      {
        tags: [testingTag, scopeTag],
        vpcId: this.vpcL1.attrVpcId,
      },
    );

    //const gatewayAssociation = new cdk.aws_ec2.CfnGatewayRouteTableAssociation(this, 'gatewayAssociation', {
    //  gatewayId: internetGateway.attrInternetGatewayId,
    //  routeTableId: routeTable.attrRouteTableId
    //})

    const publicSubnetRouteTableAssociation =
      new cdk.aws_ec2.CfnSubnetRouteTableAssociation(
        this,
        "publicSubnetRouteTableAssociation",
        {
          routeTableId: publicRouteTable.attrRouteTableId,
          subnetId: this.publicSubnet.attrSubnetId,
        },
      );

    // const networkInterface = new cdk.aws_ec2.CfnNetworkInterface(this, 'networkInterface', {
    //  description: `Test VPC-${props.scope}`,
    //  // groupSet: security group ids
    //  subnetId: publicSubnet.attrSubnetId,
    //  tags: [testingTag, scopeTag]
    //})

    const route = new cdk.aws_ec2.CfnRoute(this, "route", {
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: internetGateway.attrInternetGatewayId,
      // networkInterfaceId: networkInterface.attrId,
      routeTableId: publicRouteTable.attrRouteTableId,
    });
    // Is this dependency needed?
    internetGateway.addDependency(this.vpcL1);
    route.addDependency(internetGateway);

    const privateRouteTable = new cdk.aws_ec2.CfnRouteTable(
      this,
      "privateRouteTable",
      {
        tags: [testingTag, scopeTag],
        vpcId: this.vpcL1.attrVpcId,
      },
    );

    // This isn't deployed to an availability zone, what does that mean?
    this.privateSubnet = new cdk.aws_ec2.CfnSubnet(this, "privateSubnet", {
      // availabilityZone: 'us-east-1',
      cidrBlock: "172.31.16.0/20",
      // If you turn this off make sure to turn off `associatePublicIpAddress` on the private EC2
      mapPublicIpOnLaunch: true,
      tags: [testingTag, scopeTag],
      vpcId: this.vpcL1.attrVpcId,
      availabilityZone: "us-east-2a",
    });

    const eip = new cdk.aws_ec2.CfnEIP(this, "elasticIp", {
      networkBorderGroup: "us-east-2",
      tags: [testingTag, scopeTag],
    });

    /**
     * Some what unintuitively, or (maybe) intuitively, the NAT Gateway must reside
     * inside a public subnet even though it routes traffic from a private subnet to
     * the internet
     */
    const natGateway = new cdk.aws_ec2.CfnNatGateway(this, "natGateway", {
      allocationId: eip.attrAllocationId,
      subnetId: this.publicSubnet.attrSubnetId,
      tags: [testingTag, scopeTag],
    });

    //new cdk.aws_ec2.CfnEIPAssociation(this, 'eipAssociation', {

    //})

    // new cdk.aws_ec2.CfnGatewayRouteTableAssociation(this, 'gatewayRouteAssociation', {
    //   gatewayId: natGateway.attrNatGatewayId,
    //   routeTableId: privateRouteTable.attrRouteTableId
    // })

    const privateSubnetRouteTableAssociation =
      new cdk.aws_ec2.CfnSubnetRouteTableAssociation(
        this,
        "privateSubnetRouteTableAssociation",
        {
          routeTableId: privateRouteTable.attrRouteTableId,
          subnetId: this.privateSubnet.attrSubnetId,
        },
      );

    new cdk.aws_ec2.CfnRoute(this, "privateRoute", {
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGateway.attrNatGatewayId,
      routeTableId: privateRouteTable.attrRouteTableId,
    });
  }
}
