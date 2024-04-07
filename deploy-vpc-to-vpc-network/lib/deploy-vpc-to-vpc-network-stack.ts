import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployVpcToVpcNetworkStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployVpcToVpcNetworkStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployVpcToVpcNetworkStackProps,
  ) {
    super(scope, id, props);

    const tags = [new cdk.Tag("scope", props.scope)];

    const availabilityZone = `${props.env!.region!}a`;

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

    const publicSubnetVpcA = new cdk.aws_ec2.Subnet(this, "publicSubnetVpcA", {
      availabilityZone: availabilityZone,
      vpcId: vpcA.vpcId,
      cidrBlock: "10.0.0.0/24",
      mapPublicIpOnLaunch: true,
    });

    new cdk.aws_ec2.CfnRoute(this, "publicRouteVpcA", {
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: internetGateway.attrInternetGatewayId,
      routeTableId: publicSubnetVpcA.routeTable.routeTableId,
    });

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

    const transitGateway = new cdk.aws_ec2.CfnTransitGateway(
      this,
      "transitGateway",
      {
        description: "Transit Gateway connecting VPC A and VPC B",
        tags: tags,
      },
    );

    // TODO: Is this needed? Isn't a Transit Gateway Route Table auto-attached?
    new cdk.aws_ec2.CfnTransitGatewayRouteTable(
      this,
      "transitGatewayRouteTable",
      {
        transitGatewayId: transitGateway.attrId,
        tags: tags,
      },
    );

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

    // TODO: The ID doesn't match the VPC
    const privateRoute = new cdk.aws_ec2.CfnRoute(
      this,
      "vpcAToTransitGateway",
      {
        destinationCidrBlock: vpcBCidr,
        transitGatewayId: transitGateway.attrId,
        routeTableId: publicSubnetVpcA.routeTable.routeTableId,
      },
    );
    privateRoute.addDependency(transitGatewayAttachmentVpcA);

    // TODO: The ID doesn't match the VPC
    const privateRouteB = new cdk.aws_ec2.CfnRoute(
      this,
      "vpcBToTransitGateway",
      {
        destinationCidrBlock: vpcACidr,
        transitGatewayId: transitGateway.attrId,
        routeTableId: privateIsolatedSubnetVpcB.routeTable.routeTableId,
      },
    );
    privateRouteB.addDependency(transitGatewayAttachmentVpcB);

    /**
     * EC2 Instances
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

    new cdk.aws_ec2.Instance(this, "publicInstanceVpcA", {
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
    });

    const securityGroupVpcB = new cdk.aws_ec2.SecurityGroup(
      this,
      "securityGroupVpcB",
      {
        securityGroupName: `ec2InstanceVpcB-${props.scope}`,
        description: "Allow all traffic",
        vpc: vpcB,
      },
    );
    securityGroupVpcB.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.allTraffic(),
      "Allow all",
    );

    /**
     * Notice this EC2 instance doens't have an UserData object attached to it
     */
    new cdk.aws_ec2.Instance(this, "privateIsolatedInstanceVpcB", {
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
    });
  }
}
