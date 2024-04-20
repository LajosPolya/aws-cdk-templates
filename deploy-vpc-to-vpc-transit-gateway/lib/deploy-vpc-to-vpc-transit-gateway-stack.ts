import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployVpcToVpcTransitGatewayStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployVpcToVpcTransitGatewayStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployVpcToVpcTransitGatewayStackProps,
  ) {
    super(scope, id, props);

    const tags = [new cdk.Tag("scope", props.scope)];

    const availabilityZone = `${props.env!.region!}a`;

    /**
     * 1. Deploy VPC A. This VPC will have connection to VPC B
     */
    const vpcACidr = "10.0.0.0/16";
    const vpcA = new cdk.aws_ec2.Vpc(this, "vpcA", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(vpcACidr),
      availabilityZones: [availabilityZone],
      natGateways: 0,
      subnetConfiguration: [],
      vpnGateway: false,
      vpnRoutePropagation: [],
      vpcName: `vpcA-${props.scope}`,
      createInternetGateway: false,
    });

    /**
     * 2. Deploy an Internet Gateway and attach it to VPC A. The Internet
     * Gateway will allow VPC A to route traffic to the Public Internet.
     */
    const internetGateway = new cdk.aws_ec2.CfnInternetGateway(this, "id", {
      tags: tags,
    });

    new cdk.aws_ec2.CfnVPCGatewayAttachment(
      this,
      "attachInternetGatewayToVpc",
      {
        internetGatewayId: internetGateway.attrInternetGatewayId,
        vpcId: vpcA.vpcId,
      },
    );

    /**
     * 3. Deploy a Subnet and make it a Public Subnet by create a Route
     * to direct traffic to the Internet Gateway.
     */
    const publicSubnetVpcACidr = "10.0.0.0/24";
    const publicSubnetVpcA = new cdk.aws_ec2.Subnet(this, "publicSubnetVpcA", {
      availabilityZone: availabilityZone,
      vpcId: vpcA.vpcId,
      cidrBlock: publicSubnetVpcACidr,
      mapPublicIpOnLaunch: true,
    });

    new cdk.aws_ec2.CfnRoute(this, "publicRouteVpcA", {
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: internetGateway.attrInternetGatewayId,
      routeTableId: publicSubnetVpcA.routeTable.routeTableId,
    });

    /**
     * 4. Deploy VPC B and a Private Isolated Subnet within the VPC.
     * This VPC doesn't have access to the Public Internet.
     */
    const vpcBCidr = "10.1.0.0/16";
    const vpcB = new cdk.aws_ec2.Vpc(this, "vpcB", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(vpcBCidr),
      availabilityZones: [availabilityZone],
      natGateways: 0,
      subnetConfiguration: [],
      vpnGateway: false,
      vpnRoutePropagation: [],
      vpcName: `vpcB-${props.scope}`,
      createInternetGateway: false,
    });

    const privateIsolatedSubnetVpcB = new cdk.aws_ec2.Subnet(
      this,
      "privateIsolatedSubnetVpcB",
      {
        availabilityZone: availabilityZone,
        vpcId: vpcB.vpcId,
        cidrBlock: "10.1.0.0/24",
      },
    );

    /**
     * 5. Create a Transit Gateway to allow the two VPCs to
     * communicate.
     */
    const transitGateway = new cdk.aws_ec2.CfnTransitGateway(
      this,
      "transitGateway",
      {
        description: "Transit Gateway connecting VPC A and VPC B",
        tags: tags,
      },
    );

    /**
     * 6. Attach both VPCs to the Transit Gateway.
     */
    const transitGatewayAttachmentVpcA =
      new cdk.aws_ec2.CfnTransitGatewayVpcAttachment(
        this,
        "transitGatewayAttachmentToVpcA",
        {
          vpcId: vpcA.vpcId,
          transitGatewayId: transitGateway.attrId,
          subnetIds: [publicSubnetVpcA.subnetId],
          tags: tags,
        },
      );

    const transitGatewayAttachmentVpcB =
      new cdk.aws_ec2.CfnTransitGatewayVpcAttachment(
        this,
        "transitGatewayAttachmentToVpcB",
        {
          vpcId: vpcB.vpcId,
          transitGatewayId: transitGateway.attrId,
          subnetIds: [privateIsolatedSubnetVpcB.subnetId],
          tags: tags,
        },
      );

    /**
     * 7. Traffic from VPC A's Public Subnet to VPC B is routed to the
     * Transit Gateway. This is what allows VPC A to communicate with
     * VPC B.
     */
    const privateSubnetVpcAToTransitGateway = new cdk.aws_ec2.CfnRoute(
      this,
      "vpcAToTransitGateway",
      {
        destinationCidrBlock: vpcBCidr,
        transitGatewayId: transitGateway.attrId,
        routeTableId: publicSubnetVpcA.routeTable.routeTableId,
      },
    );
    privateSubnetVpcAToTransitGateway.addDependency(
      transitGatewayAttachmentVpcA,
    );

    /**
     * 8. Traffic from VPC B's Private Subnet to VPC A is routed to the
     * Transit Gateway. This is what allows VPC B to communicate with
     * VPC A.
     */
    const privateSubnetVpcBToTransitGateway = new cdk.aws_ec2.CfnRoute(
      this,
      "vpcBToTransitGateway",
      {
        destinationCidrBlock: vpcACidr,
        transitGatewayId: transitGateway.attrId,
        routeTableId: privateIsolatedSubnetVpcB.routeTable.routeTableId,
      },
    );
    privateSubnetVpcBToTransitGateway.addDependency(
      transitGatewayAttachmentVpcB,
    );

    /**
     * 9. Create a Security Group for VPC A EC2 Instances to allow all
     * ingress and egress traffic.
     */
    const securityGroupVpcA = new cdk.aws_ec2.SecurityGroup(
      this,
      "securityGroupVpcA",
      {
        securityGroupName: `ec2InstanceVpcA-${props.scope}`,
        description: "Allow all traffic",
        vpc: vpcA,
      },
    );
    securityGroupVpcA.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.allTraffic(),
      "Allow all",
    );

    /**
     * 10. Create User Data for VPC A EC2 Instances to download and start an HTTP Server.
     */
    const userData = cdk.aws_ec2.UserData.forLinux();
    // This list of commands was copied from Stephane Maarek's AWS Certified Associate DVA-C01 Udemy Course
    userData.addCommands(
      "#!/bin/bash",
      "yum update -y",
      "yum install -y httpd",
      "systemctl start httpd",
      "systemctl enable httpd",
      'echo "<h1>Hello world from $(hostname -f)</h1>" > /var/www/html/index.html',
    );

    /**
     * 11. Deploy and EC2 Instance in VPC A's Public Subnet.
     */
    const publicInstance = new cdk.aws_ec2.Instance(
      this,
      "publicInstanceVpcA",
      {
        vpcSubnets: {
          subnets: [publicSubnetVpcA],
        },
        vpc: vpcA,
        securityGroup: securityGroupVpcA,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO,
        ),
        machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
        userData: userData,
        instanceName: `publicVpcA-${props.scope}`,
      },
    );

    /**
     * 12. Create a Security Group for VPC B EC2 Instances to allow ICMP Ping
     * traffic from VPC A's Public Subnet. Note that we don't need to allow all
     * IPV4 traffic since the EC2 Instance this is attached to doesn't have an
     * HTTP server and thus can only respond to ICMP Ping.
     */
    const securityGroupVpcB = new cdk.aws_ec2.SecurityGroup(
      this,
      "securityGroupVpcB",
      {
        securityGroupName: `ec2InstanceVpcB-${props.scope}`,
        description: "Allow ICMP Ping from VPC A Public Subnet",
        vpc: vpcB,
      },
    );
    securityGroupVpcB.addIngressRule(
      cdk.aws_ec2.Peer.ipv4(publicSubnetVpcACidr),
      cdk.aws_ec2.Port.icmpPing(),
      "Allow ICMP Ping from VPC A Public Subnet",
    );

    /**
     * 13. Deply an EC2 Instance in VPC B's Private Isolated Subnet.
     * Notice this EC2 instance doens't have an UserData object to download
     * external data. This is because an EC2 intance in a Private Isolated
     * Subnet isn't able to download external software.
     */
    const privateInstance = new cdk.aws_ec2.Instance(
      this,
      "privateIsolatedInstanceVpcB",
      {
        vpcSubnets: {
          subnets: [privateIsolatedSubnetVpcB],
        },
        vpc: vpcB,
        securityGroup: securityGroupVpcB,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO,
        ),
        machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
        instanceName: `privateVpcB-${props.scope}`,
      },
    );

    /**
     * 14. Deploy outputs
     */
    new cdk.CfnOutput(this, "publicInstancePublicIp", {
      description: "Public IP of the Public Instance in VPC A",
      value: publicInstance.instancePublicIp,
      exportName: `publicInstancePublicIp-${props.scope}`,
    });

    new cdk.CfnOutput(this, "privateInstancePrivateIp", {
      description: "Private IP of the Private Instance in VPC B",
      value: privateInstance.instancePrivateIp,
      exportName: `privateInstancePrivateIp-${props.scope}`,
    });
  }
}
