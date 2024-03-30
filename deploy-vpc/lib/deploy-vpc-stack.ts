import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployVpcStackProps extends cdk.StackProps {
  scope: string;
  vpcTag: string;
}

export class DeployVpcStack extends cdk.Stack {
  vpcL1: cdk.aws_ec2.CfnVPC;
  privateIsolatedSubnet: cdk.aws_ec2.CfnSubnet;
  privateWithEgressSubnet: cdk.aws_ec2.CfnSubnet;
  publicSubnet: cdk.aws_ec2.CfnSubnet;
  stackTags: {
    [key: string]: string;
  } = {};

  constructor(scope: Construct, id: string, props: DeployVpcStackProps) {
    super(scope, id, props);

    const availabilityZone = `${props.env!.region!}a`;

    const scopeTag = new cdk.Tag(props.scope, props.scope);
    const vpcTag = new cdk.Tag(props.vpcTag, props.vpcTag);
    const tags = [scopeTag, vpcTag];

    // Tags aren't unique so deploying a VPC with the same tags as
    // a recently deleted VPC may produce an error
    /**
     * 1. Deploy a VPC
     */
    this.vpcL1 = new cdk.aws_ec2.CfnVPC(this, "vpc", {
      cidrBlock: "172.31.0.0/16",
      enableDnsSupport: true,
      tags: tags,
    });

    /**
     * 2. Deploy an Internet Gateway and attach it to the VPC.
     * And Internet Gatway gives the VPC access to the public
     * internet.
     */
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

    /**
     * 3. Create the Public Subnet
     */
    this.publicSubnet = new cdk.aws_ec2.CfnSubnet(this, "publicSubnet", {
      cidrBlock: "172.31.0.0/20",
      mapPublicIpOnLaunch: true,
      tags: tags,
      vpcId: this.vpcL1.attrVpcId,
      availabilityZone: availabilityZone,
    });

    /**
     * 4. Create a Route Table for the Public Subnet
     */
    const publicRouteTable = new cdk.aws_ec2.CfnRouteTable(
      this,
      "publicRouteTable",
      {
        tags: tags,
        vpcId: this.vpcL1.attrVpcId,
      },
    );

    /**
     * 5. Associate the Public Subnet to the Public Route Table
     */
    new cdk.aws_ec2.CfnSubnetRouteTableAssociation(
      this,
      "publicSubnetRouteTableAssociation",
      {
        routeTableId: publicRouteTable.attrRouteTableId,
        subnetId: this.publicSubnet.attrSubnetId,
      },
    );

    /**
     * 6. Create a Route from the Public Route Table to the Internet Gateway.
     *
     * Routing traffic from the Public Subnet to the Internet Gateway
     * is what allows access to the Public Internet and it's what makes
     * the Public Subnet public.
     */
    const route = new cdk.aws_ec2.CfnRoute(this, "route", {
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: internetGateway.attrInternetGatewayId,
      routeTableId: publicRouteTable.attrRouteTableId,
    });
    // Is this dependency needed?
    internetGateway.addDependency(this.vpcL1);
    route.addDependency(internetGateway);

    /**
     * 7. Create the Private with Egress Subnet
     */
    this.privateWithEgressSubnet = new cdk.aws_ec2.CfnSubnet(
      this,
      "privateWithEgressSubnet",
      {
        cidrBlock: "172.31.16.0/20",
        // If you turn this off make sure to turn off `associatePublicIpAddress` on the private EC2
        mapPublicIpOnLaunch: true,
        tags: tags,
        vpcId: this.vpcL1.attrVpcId,
        availabilityZone: availabilityZone,
      },
    );

    /**
     * 8. Create the Private with Egress Route Table
     */
    const privateWithEgressRouteTable = new cdk.aws_ec2.CfnRouteTable(
      this,
      "privateWithEgressRouteTable",
      {
        tags: tags,
        vpcId: this.vpcL1.attrVpcId,
      },
    );

    /**
     * 9. Associate the Private with Egress Subnet to the Private with
     * Egress Route Table
     */
    new cdk.aws_ec2.CfnSubnetRouteTableAssociation(
      this,
      "privateWithEgressSubnetRouteTableAssociation",
      {
        routeTableId: privateWithEgressRouteTable.attrRouteTableId,
        subnetId: this.privateWithEgressSubnet.attrSubnetId,
      },
    );

    /**
     * 10. Create an Elastic IP
     * An Elastic IP is needed for the NAT Gateway.
     */
    const eip = new cdk.aws_ec2.CfnEIP(this, "elasticIp", {
      tags: tags,
    });

    /**
     * 11. Create a NAT Gateway.
     * The NAT Gateway allows instances to initiate outbound connections to the
     * Public Internet but the Public Internet is not able to initiate inbound
     * connection to instances within Private with Eggress Subnet.
     *
     * Somewhat unintuitively, or (maybe) intuitively, the NAT Gateway must reside
     * in a public subnet even though it routes traffic from a private subnet to
     * the public internet.
     */
    const natGateway = new cdk.aws_ec2.CfnNatGateway(this, "natGateway", {
      allocationId: eip.attrAllocationId,
      subnetId: this.publicSubnet.attrSubnetId,
      tags: tags,
    });

    /**
     * 12. Create a Route from the Private with Egress Route Table to the
     * NAT Gateway.
     *
     * Routing traffic from the Private with Egress Subnet to the NAT Gateway
     * is what allows access to the Public Internet and it's what allows
     * egress from within the Private with Egress Subnet.
     */
    new cdk.aws_ec2.CfnRoute(this, "privateWithEgressRouteToNatGateway", {
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGateway.attrNatGatewayId,
      routeTableId: privateWithEgressRouteTable.attrRouteTableId,
    });

    /**
     * 13. Private Isolated Subnet
     */
    this.privateIsolatedSubnet = new cdk.aws_ec2.CfnSubnet(
      this,
      "privateIsolatedSubnet",
      {
        cidrBlock: "172.31.32.0/20",
        // If you turn this off make sure to turn off `associatePublicIpAddress` on the private EC2
        mapPublicIpOnLaunch: true,
        tags: tags,
        vpcId: this.vpcL1.attrVpcId,
        availabilityZone: availabilityZone,
      },
    );

    /**
     * 14. Private Isolated Route Table
     *
     * Each Route Table has a default route which allows private access
     * to the entire VPC which is why instances from the other subnets
     * are able to communicate with instances from the Private Isolated
     * Subnet via their Private IPs.
     */
    const privateIsolatedRouteTable = new cdk.aws_ec2.CfnRouteTable(
      this,
      "privateIsolatedRouteTable",
      {
        tags: tags,
        vpcId: this.vpcL1.attrVpcId,
      },
    );

    /**
     * 15. Associate the Private Isolated Subnet to the
     * Private Isolated Route Table.
     */
    new cdk.aws_ec2.CfnSubnetRouteTableAssociation(
      this,
      "privateIsolatedSubnetRouteTableAssociation",
      {
        routeTableId: privateIsolatedRouteTable.attrRouteTableId,
        subnetId: this.privateIsolatedSubnet.attrSubnetId,
      },
    );

    // These tags are used by the other stack to query for the VPC
    tags.forEach((tag) => {
      this.stackTags[tag.key] = tag.value;
    });
  }
}
