import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployVpcStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployVpcStack extends cdk.Stack {
  vpcL1: cdk.aws_ec2.CfnVPC;

  constructor(scope: Construct, id: string, props: DeployVpcStackProps) {
    super(scope, id, props);

    const testingTag = new cdk.Tag("test", "testTag", { priority: 1000 });
    const scopeTag = new cdk.Tag(props.scope, props.scope, { priority: 1000 });
    const oneTag = new cdk.Tag("1", "1", { priority: 1000 });

    this.vpcL1 = new cdk.aws_ec2.CfnVPC(this, "vpc", {
      cidrBlock: "10.0.0.0/16",
      // TODO: should I just stick to IP addresses instead of DNS support?
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: [testingTag, scopeTag, oneTag],
    });

    // This isn't deployed to an availability zone, what does that mean?
    const publicSubnet = new cdk.aws_ec2.CfnSubnet(this, "publicSubnet", {
      // availabilityZone: 'us-east-1',
      cidrBlock: "10.0.0.0/24",
      mapPublicIpOnLaunch: true,
      tags: [testingTag, scopeTag],
      vpcId: this.vpcL1.attrVpcId,
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

    const routeTable = new cdk.aws_ec2.CfnRouteTable(this, "routeTable", {
      tags: [testingTag, scopeTag],
      vpcId: this.vpcL1.attrVpcId,
    });

    //const gatewayAssociation = new cdk.aws_ec2.CfnGatewayRouteTableAssociation(this, 'gatewayAssociation', {
    //  gatewayId: internetGateway.attrInternetGatewayId,
    //  routeTableId: routeTable.attrRouteTableId
    //})

    const subnetRouteTableAssociation =
      new cdk.aws_ec2.CfnSubnetRouteTableAssociation(
        this,
        "routeTableAssociation",
        {
          routeTableId: routeTable.attrRouteTableId,
          subnetId: publicSubnet.attrSubnetId,
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
      routeTableId: routeTable.attrRouteTableId,
    });
    internetGateway.addDependency(this.vpcL1);
    route.addDependency(internetGateway);
  }
}
