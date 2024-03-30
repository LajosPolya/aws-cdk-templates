import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployVpcStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployVpcStack extends cdk.Stack {
  vpcL1: cdk.aws_ec2.CfnVPC;
  privateIsolatedSubnet: cdk.aws_ec2.CfnSubnet;
  privateWithEgressSubnet: cdk.aws_ec2.CfnSubnet;
  publicSubnet: cdk.aws_ec2.CfnSubnet;
  stackTags: {
    [key: string]: string;
  };

  constructor(scope: Construct, id: string, props: DeployVpcStackProps) {
    super(scope, id, props);

    const testingTag = new cdk.Tag("test", "testTag", { priority: 1000 });
    const scopeTag = new cdk.Tag(props.scope, props.scope, { priority: 1000 });
    const oneTag = new cdk.Tag("46", "46", { priority: 1000 });

    // tags aren't unique so deploying and then deleting deployment
    // may return wrong VPC
    const tags = [testingTag, scopeTag, oneTag];
    this.vpcL1 = new cdk.aws_ec2.CfnVPC(this, "vpc", {
      cidrBlock: "172.31.0.0/16",
      enableDnsSupport: true,
      tags: tags,
    });

    /**
     * Private Isolated Route Table and Subnet
     */
    // This isn't deployed to an availability zone, what does that mean?
    this.publicSubnet = new cdk.aws_ec2.CfnSubnet(this, "publicSubnet", {
      // availabilityZone: 'us-east-1',
      cidrBlock: "172.31.0.0/20",
      mapPublicIpOnLaunch: true,
      tags: tags,
      vpcId: this.vpcL1.attrVpcId,
      availabilityZone: "us-east-2a",
    });

    const internetGateway = new cdk.aws_ec2.CfnInternetGateway(
      this,
      "internetGateway",
      {
        tags: tags,
      },
    );

    new cdk.aws_ec2.CfnVPCGatewayAttachment(this, "gatewayAttachment", {
      internetGatewayId: internetGateway.attrInternetGatewayId,
      vpcId: this.vpcL1.attrVpcId,
    });

    const publicRouteTable = new cdk.aws_ec2.CfnRouteTable(
      this,
      "publicRouteTable",
      {
        tags: tags,
        vpcId: this.vpcL1.attrVpcId,
      },
    );

    //const gatewayAssociation = new cdk.aws_ec2.CfnGatewayRouteTableAssociation(this, 'gatewayAssociation', {
    //  gatewayId: internetGateway.attrInternetGatewayId,
    //  routeTableId: routeTable.attrRouteTableId
    //})

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

    /**
     * Private with Egress Route Table and Subnet
     */
    const privateWithEgressRouteTable = new cdk.aws_ec2.CfnRouteTable(
      this,
      "privateWithEgressRouteTable",
      {
        tags: tags,
        vpcId: this.vpcL1.attrVpcId,
      },
    );

    // This isn't deployed to an availability zone, what does that mean?
    this.privateWithEgressSubnet = new cdk.aws_ec2.CfnSubnet(
      this,
      "privateWithEgressSubnet",
      {
        // availabilityZone: 'us-east-1',
        cidrBlock: "172.31.16.0/20",
        // If you turn this off make sure to turn off `associatePublicIpAddress` on the private EC2
        mapPublicIpOnLaunch: true,
        tags: tags,
        vpcId: this.vpcL1.attrVpcId,
        availabilityZone: "us-east-2a",
      },
    );

    const eip = new cdk.aws_ec2.CfnEIP(this, "elasticIp", {
      networkBorderGroup: "us-east-2",
      tags: tags,
    });

    /**
     * Some what unintuitively, or (maybe) intuitively, the NAT Gateway must reside
     * inside a public subnet even though it routes traffic from a private subnet to
     * the internet
     */
    const natGateway = new cdk.aws_ec2.CfnNatGateway(this, "natGateway", {
      allocationId: eip.attrAllocationId,
      subnetId: this.publicSubnet.attrSubnetId,
      tags: tags,
    });

    //new cdk.aws_ec2.CfnEIPAssociation(this, 'eipAssociation', {

    //})

    // new cdk.aws_ec2.CfnGatewayRouteTableAssociation(this, 'gatewayRouteAssociation', {
    //   gatewayId: natGateway.attrNatGatewayId,
    //   routeTableId: privateRouteTable.attrRouteTableId
    // })

    new cdk.aws_ec2.CfnSubnetRouteTableAssociation(
      this,
      "privateWithEgressSubnetRouteTableAssociation",
      {
        routeTableId: privateWithEgressRouteTable.attrRouteTableId,
        subnetId: this.privateWithEgressSubnet.attrSubnetId,
      },
    );

    new cdk.aws_ec2.CfnRoute(this, "privateWithEgressRouteToNatGateway", {
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGateway.attrNatGatewayId,
      routeTableId: privateWithEgressRouteTable.attrRouteTableId,
    });

    /**
     * Private Isolated Route Table and Subnet
     */
    const privateIsolatedRouteTable = new cdk.aws_ec2.CfnRouteTable(
      this,
      "privateIsolatedRouteTable",
      {
        tags: tags,
        vpcId: this.vpcL1.attrVpcId,
      },
    );

    // This isn't deployed to an availability zone, what does that mean?
    this.privateIsolatedSubnet = new cdk.aws_ec2.CfnSubnet(
      this,
      "privateIsolatedSubnet",
      {
        // availabilityZone: 'us-east-1',
        cidrBlock: "172.31.32.0/20",
        // If you turn this off make sure to turn off `associatePublicIpAddress` on the private EC2
        mapPublicIpOnLaunch: true,
        tags: tags,
        vpcId: this.vpcL1.attrVpcId,
        availabilityZone: "us-east-2a",
      },
    );

    new cdk.aws_ec2.CfnSubnetRouteTableAssociation(
      this,
      "privateIsolatedSubnetRouteTableAssociation",
      {
        routeTableId: privateIsolatedRouteTable.attrRouteTableId,
        subnetId: this.privateIsolatedSubnet.attrSubnetId,
      },
    );

    // These tags are used by the other stack to query for the VPC
    this.stackTags = {};
    tags.forEach((tag) => {
      this.stackTags[tag.key] = tag.value;
    });
  }
}
