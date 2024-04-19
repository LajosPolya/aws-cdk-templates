import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployVpcToVpcNatGatewayStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployVpcToVpcNatGatewayStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployVpcToVpcNatGatewayStackProps,
  ) {
    super(scope, id, props);

    const tags = [new cdk.Tag("scope", props.scope)];

    const availabilityZoneA = `${props.env!.region!}a`;
    const availabilityZoneB = `${props.env!.region!}b`;

    /**
     * 1. Deploy VPC A. VPC A will be able to connect to VPC B.
     */
    const vpcACidr = "10.0.0.0/16";
    const vpcA = new cdk.aws_ec2.Vpc(this, "vpcA", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(vpcACidr),
      availabilityZones: [availabilityZoneA],
      natGateways: 0,
      subnetConfiguration: [],
      vpnGateway: false,
      vpnRoutePropagation: [],
      vpcName: `vpcA-${props.scope}`,
      createInternetGateway: false,
    });

    /**
     * 2. Create a Non-Routable Subnet in VPC A. This subnet has the same CIDR as the Non-Routable
     * Subnet in VPC B.
     *
     * The CDK doesn't fully support VPCs with multiple CIDRs so they have to be created
     * using CfnVPCCidrBlock
     */
    const nonRouteableCidr = "100.0.0.0/16";
    const nonRouteableCidrBlock = new cdk.aws_ec2.CfnVPCCidrBlock(
      this,
      "secondCidrBlock",
      {
        cidrBlock: nonRouteableCidr,
        vpcId: vpcA.vpcId,
      },
    );

    /**
     * 3. Deploy an Internet Gateway in VPC A to create a Public Subnet.
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
     * 4. Create a Public Subnet in VPC A.
     */
    const publicSubnetVpcACidr = "10.0.0.0/24";
    const publicSubnetVpcA = new cdk.aws_ec2.Subnet(this, "publicSubnetVpcA", {
      availabilityZone: availabilityZoneA,
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
     * 5. Create a private Non-Routable Subnet in VPC A.
     * https://github.com/aws/aws-cdk/issues/9573
     * Add second CIDR to VPC A and make it a Non-Routable Subnet
     */
    const privateNonRoutableSubnetVpcA = new cdk.aws_ec2.Subnet(
      this,
      "privateNonRoutableSubnetVpcA",
      {
        availabilityZone: availabilityZoneA,
        vpcId: vpcA.vpcId,
        cidrBlock: nonRouteableCidr,
        mapPublicIpOnLaunch: true,
      },
    );
    privateNonRoutableSubnetVpcA.node.addDependency(nonRouteableCidrBlock);

    /**
     * 6. Create a Private NAT Gateway. This Private NAT Gateway will allow the Non-Routable
     * Subnet to communicate with the other Non-Routable Subnet in VPC B.
     */
    // An arbitrary IP address from the Public Subnet of VPC A (10.0.0.0/24)
    const privateNatGatewayIpAddress = "10.0.0.10";
    const privateNatGateway = new cdk.aws_ec2.CfnNatGateway(
      this,
      "privateNatGateway",
      {
        connectivityType: "private",
        subnetId: publicSubnetVpcA.subnetId,
        tags: tags,
        privateIpAddress: privateNatGatewayIpAddress,
      },
    );

    /**
     * 7. Create a Public NAT Gateway in VPC A for a Routable Subnet
     */
    const eipA = new cdk.aws_ec2.CfnEIP(this, "elasticIpA", {
      tags: tags,
    });

    const publicNatGatewayA = new cdk.aws_ec2.CfnNatGateway(
      this,
      "publicNatGatewayVpcA",
      {
        allocationId: eipA.attrAllocationId,
        subnetId: publicSubnetVpcA.subnetId,
        tags: tags,
      },
    );

    new cdk.aws_ec2.CfnRoute(this, "privateRoutableToNatGatewayVpcA", {
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: publicNatGatewayA.attrNatGatewayId,
      routeTableId: privateNonRoutableSubnetVpcA.routeTable.routeTableId,
    });

    /**
     * 8. Create VPC B. VPC B will also have a Non-routable Subnet with the same CIDR
     * as VPC A's Non-Routable Subnet
     */
    const vpcBCidr = "11.0.0.0/16";
    const vpcB = new cdk.aws_ec2.Vpc(this, "vpcB", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(vpcBCidr),
      availabilityZones: [availabilityZoneA],
      natGateways: 0,
      subnetConfiguration: [],
      vpnGateway: false,
      vpnRoutePropagation: [],
      vpcName: `vpcB-${props.scope}`,
      createInternetGateway: false,
    });

    /**
     * 9. Create an Internet Gateway in VPC B. This Internet Gateway is only present to allow
     * the EC2 Instance in the Non-Routable Subnet to download an HTTP server
     */
    const internetGatewayB = new cdk.aws_ec2.CfnInternetGateway(this, "igB", {
      tags: tags,
    });

    new cdk.aws_ec2.CfnVPCGatewayAttachment(
      this,
      "attachInternetGatewayToVpcB",
      {
        internetGatewayId: internetGatewayB.attrInternetGatewayId,
        vpcId: vpcB.vpcId,
      },
    );

    /**
     * 10. Create a Public Subnet in VPC B
     */
    const publicSubnetVpcB = new cdk.aws_ec2.Subnet(this, "publicSubnetVpcB", {
      availabilityZone: availabilityZoneA,
      vpcId: vpcB.vpcId,
      cidrBlock: "11.0.0.0/24",
      mapPublicIpOnLaunch: true,
    });

    new cdk.aws_ec2.CfnRoute(this, "publicRouteVpcB", {
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: internetGatewayB.attrInternetGatewayId,
      routeTableId: publicSubnetVpcB.routeTable.routeTableId,
    });

    /**
     * 11. Create a second empty Subnet in VPC B. This subnet is only present because
     * the ALB must be connected to two subnets
     */
    const privateSubnetVpcBForAlb = new cdk.aws_ec2.Subnet(
      this,
      "privateSubnetVpcBForAlb",
      {
        availabilityZone: availabilityZoneB,
        vpcId: vpcB.vpcId,
        cidrBlock: "11.0.1.0/24",
        mapPublicIpOnLaunch: true,
      },
    );

    /**
     * 12. Create Private Routable Subnet in VPC B.
     */
    const privateRoutableCidrVpcB = "11.0.128.0/24";
    const privateRoutableSubnetVpcB = new cdk.aws_ec2.Subnet(
      this,
      "privateIsolatedSubnetVpcB",
      {
        availabilityZone: availabilityZoneA,
        vpcId: vpcB.vpcId,
        cidrBlock: privateRoutableCidrVpcB,
      },
    );

    /**
     * 13. Create a Non-Routable Subnet in VPC B. This subnet has the same CIDR as the Non-Routable
     * Subnet in VPC A.
     */
    const nonRouteableCidrBlockVpcB = new cdk.aws_ec2.CfnVPCCidrBlock(
      this,
      "secondCidrBlockVpcB",
      {
        cidrBlock: nonRouteableCidr,
        vpcId: vpcB.vpcId,
      },
    );

    // Add second CIDR to VPC B
    const privateNonRoutableSubnetVpcB = new cdk.aws_ec2.Subnet(
      this,
      "privateNonRoutableSubnetVpcB",
      {
        availabilityZone: availabilityZoneA,
        vpcId: vpcB.vpcId,
        cidrBlock: nonRouteableCidr,
        mapPublicIpOnLaunch: true,
      },
    );
    privateNonRoutableSubnetVpcB.node.addDependency(nonRouteableCidrBlockVpcB);

    /**
     * 14. Create a Private NAT Gateway to allow the Non-Routalbe Subnet access to the internet to
     * download the HTTP Server.
     */
    const eip = new cdk.aws_ec2.CfnEIP(this, "elasticIp", {
      tags: tags,
    });

    const publicNatGatewayB = new cdk.aws_ec2.CfnNatGateway(
      this,
      "publicNatGatewayVpcB",
      {
        allocationId: eip.attrAllocationId,
        subnetId: publicSubnetVpcB.subnetId,
        tags: tags,
      },
    );

    new cdk.aws_ec2.CfnRoute(this, "privateNonRoutableToNatGatewayVpcB", {
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: publicNatGatewayB.attrNatGatewayId,
      routeTableId: privateNonRoutableSubnetVpcB.routeTable.routeTableId,
    });

    /**
     * 15. Create a Transit Gateway. The Transit Gateway allows the two VPCs to
     * communicate.
     */
    const transitGateway = new cdk.aws_ec2.CfnTransitGateway(
      this,
      "transitGateway",
      {
        defaultRouteTableAssociation: "disable",
        defaultRouteTablePropagation: "disable",
        description: "Transit Gateway connecting VPC A and VPC B",
        tags: tags,
      },
    );

    /**
     * 16. Create a Transit Gateway Route Table
     */
    const transitGatewayRouteTable =
      new cdk.aws_ec2.CfnTransitGatewayRouteTable(
        this,
        "transitGatewayRouteTable",
        {
          transitGatewayId: transitGateway.attrId,
          tags: tags,
        },
      );

    /**
     * 18. Attach the the Transit Gateway to VPC A
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

    /**
     * 19. Associate the Transit Gateway Route Table with the VPC A Transit Gateway Attachment.
     */
    new cdk.aws_ec2.CfnTransitGatewayRouteTableAssociation(
      this,
      "routeTableAssociationVpcA",
      {
        transitGatewayAttachmentId: transitGatewayAttachmentVpcA.attrId,
        transitGatewayRouteTableId:
          transitGatewayRouteTable.attrTransitGatewayRouteTableId,
      },
    );

    /**
     * 20. Create a Transit Gateway Route from VPC A to the Routable Subnet of VPC B.
     */
    new cdk.aws_ec2.CfnTransitGatewayRoute(
      this,
      "transitGatewayAttachmentToPublicRoutableCidrVpcA",
      {
        destinationCidrBlock: publicSubnetVpcACidr,
        transitGatewayAttachmentId: transitGatewayAttachmentVpcA.attrId,
        transitGatewayRouteTableId:
          transitGatewayRouteTable.attrTransitGatewayRouteTableId,
      },
    );

    /**
     * 21. Attach the the Transit Gateway to VPC B
     */
    const transitGatewayAttachmentVpcB =
      new cdk.aws_ec2.CfnTransitGatewayVpcAttachment(
        this,
        "transitGatewayAttachmentToVpcB",
        {
          vpcId: vpcB.vpcId,
          transitGatewayId: transitGateway.attrId,
          subnetIds: [privateRoutableSubnetVpcB.subnetId],
          tags: tags,
        },
      );

    /**
     * 22. Associate the Transit Gateway Route Table with the VPC B Transit Gateway Attachment
     */
    new cdk.aws_ec2.CfnTransitGatewayRouteTableAssociation(
      this,
      "routeTableAssociationVpcB",
      {
        transitGatewayAttachmentId: transitGatewayAttachmentVpcB.attrId,
        transitGatewayRouteTableId:
          transitGatewayRouteTable.attrTransitGatewayRouteTableId,
      },
    );

    /**
     * 23. Create a Transit Gateway Route from VPC B to the Routable Subnet of VPC B
     */
    new cdk.aws_ec2.CfnTransitGatewayRoute(
      this,
      "transitGatewayAttachmentToPrivateRoutableCidrVpcB",
      {
        destinationCidrBlock: privateRoutableCidrVpcB,
        transitGatewayAttachmentId: transitGatewayAttachmentVpcB.attrId,
        transitGatewayRouteTableId:
          transitGatewayRouteTable.attrTransitGatewayRouteTableId,
      },
    );

    /**
     * 24. Route traffic from un-routable subnet in VPC A through the Private NAT Gateway, through the
     * Transit Gateway to the ALB in the routable subnet in VPC B which forwards traffic to the
     * EC2 instance in the Non-Routable Subnet in VPC B
     */
    new cdk.aws_ec2.CfnRoute(this, "privateNonRoutableToNatGatewayVpcA", {
      destinationCidrBlock: privateRoutableCidrVpcB,
      natGatewayId: privateNatGateway.attrNatGatewayId,
      routeTableId: privateNonRoutableSubnetVpcA.routeTable.routeTableId,
    });

    const privateRoutableToTransitGatewayVpcA = new cdk.aws_ec2.CfnRoute(
      this,
      "privateRoutableToTransitGatewayVpcA",
      {
        destinationCidrBlock: privateRoutableCidrVpcB,
        transitGatewayId: transitGateway.attrId,
        routeTableId: publicSubnetVpcA.routeTable.routeTableId,
      },
    );
    // https://github.com/hashicorp/terraform-provider-aws/issues/10025
    privateRoutableToTransitGatewayVpcA.addDependency(
      transitGatewayAttachmentVpcA,
    );

    const privateRoutableToTransitGatewayVpcB = new cdk.aws_ec2.CfnRoute(
      this,
      "privateRoutableToTransitGatewayVpcB",
      {
        destinationCidrBlock: publicSubnetVpcACidr,
        transitGatewayId: transitGateway.attrId,
        routeTableId: privateRoutableSubnetVpcB.routeTable.routeTableId,
      },
    );
    privateRoutableToTransitGatewayVpcB.addDependency(
      transitGatewayAttachmentVpcB,
    );

    /**
     * 25. Deploy ALB. The ALB sends traffic from the routable subnet to the EC2 instance in the
     * Non-Routable Subnet.
     */
    const albSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "albSecurityGroup",
      {
        securityGroupName: `albVpcB-${props.scope}`,
        description: "Allow traffic from Private NAT Gateway on Port 80",
        vpc: vpcB,
      },
    );
    albSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.ipv4(privateNatGatewayIpAddress + "/32"),
      cdk.aws_ec2.Port.tcp(80),
      "Allow traffic from Private NAT Gateway on Port 80",
    );

    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      this,
      "alb",
      {
        securityGroup: albSecurityGroup,
        loadBalancerName: `vpcB-${props.scope}`,
        vpc: vpcB,
        vpcSubnets: {
          subnets: [privateRoutableSubnetVpcB, privateSubnetVpcBForAlb],
        },
        internetFacing: false,
        denyAllIgwTraffic: true,
      },
    );

    /**
     * 26. Deploy an EC2 instance into the Non-Routable Subnet of VPC B. Then add it as a Target to the
     * ALB in the Routable Subnet of VPC B
     */
    const privateInstanceVpcBSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "securityGroupVpcB",
      {
        securityGroupName: `ec2InstanceVpcB-${props.scope}`,
        description: "Allow all traffic from ALB",
        vpc: vpcB,
      },
    );
    privateInstanceVpcBSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.securityGroupId(albSecurityGroup.securityGroupId),
      cdk.aws_ec2.Port.tcp(80),
      "Allow all traffic from ALB",
    );

    const vpcBPrivateInstance = `privateInstanceVpcB-${props.scope}`;
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
    const vpcBInstance = new cdk.aws_ec2.Instance(this, "instanceVpcB", {
      vpcSubnets: {
        subnets: [privateNonRoutableSubnetVpcB],
      },
      vpc: vpcB,
      securityGroup: privateInstanceVpcBSecurityGroup,
      instanceType: cdk.aws_ec2.InstanceType.of(
        cdk.aws_ec2.InstanceClass.T2,
        cdk.aws_ec2.InstanceSize.MICRO,
      ),
      machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
      userData,
      instanceName: vpcBPrivateInstance,
    });

    const listener = alb.addListener("ec2", {
      port: 80,
      // https://github.com/aws/aws-cdk/issues/3177#issuecomment-508211497
      // the default of `open: true` changes the ALB's Security Group to allow all ingress
      open: false,
    });
    const instance1Target =
      new cdk.aws_elasticloadbalancingv2_targets.InstanceTarget(vpcBInstance);
    listener.addTargets("targets", {
      targets: [instance1Target],
      port: 80,
    });

    /**
     * 27. Deploy an EC2 instance in the Non-Routable Subnet of VPC A. The goal of this EC2 instance
     * is to make a request to EC2 intsance in the Non-Routable Subnet of VPC B. Note that the the
     * two Non-Routalbe Subnets have the same CIDR which is what a Private Nat Gateway and a
     * Transit Gateway is needed for them to be able to communicate.
     */
    const userDataPrivate = cdk.aws_ec2.UserData.forLinux();
    // This list of commands was copied from Stephane Maarek's AWS Certified Associate DVA-C01 Udemy Course
    /**
     * This User Data is used by the EC2 instance in the Non-Routable Subnet of VPC A. The goal of this instance is
     * to prove that it has can connect to the instance in the Non-Routable Subnet of VPC B. When a request is made to
     * this EC2 instance it makes a request, via the Transit Gateway, to the ALB in the Routable Subnet of VPC B which
     * forwards the request to the EC2 instance in the Non-Routable Subnet. Then that EC2 instance'a response makes its
     * way back to this EC2 instance.
     */
    userDataPrivate.addCommands(
      "#!/bin/bash",
      "yum update -y",
      "yum install -y httpd",
      "systemctl start httpd",
      "systemctl enable httpd",
      'echo "<h1>Hello world from $(hostname -f)</h1>" > /var/www/html/index.html',
      `echo "<h1>Connecting to VPC B Private Instance (${vpcBPrivateInstance}) via 'Private NAT Gateway -> Transit Gateway -> ALB' from $(hostname -f)</h1>" >> /var/www/html/index.html`,
      // The statement below makes a request to the load balancer in VPC B which forwards it to the EC2 instance in the Non-Routable
      // Subnet of VPC B.
      `echo "<h1>Response from ${vpcBPrivateInstance}: '$(curl --location ${alb.loadBalancerDnsName})'</h1>" >> /var/www/html/index.html`,
    );

    const openTrafficSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "securityGroupVpcA",
      {
        securityGroupName: `openTrafficVpcA-${props.scope}`,
        description: "Allow all traffic",
        vpc: vpcA,
      },
    );
    openTrafficSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.allTraffic(),
      "Allow all",
    );

    const vpcAPrivateInstanceSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "vpcAPrivateInstanceSecurityGroup",
      {
        securityGroupName: `privateEc2InstanceVpcA-${props.scope}`,
        description:
          "Allow all TCP traffic on port 80 from EC2 instance in routable subnet of VPC A",
        vpc: vpcA,
      },
    );
    vpcAPrivateInstanceSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.securityGroupId(
        openTrafficSecurityGroup.securityGroupId,
      ),
      cdk.aws_ec2.Port.tcp(80),
      "Allow all TCP traffic on port 80 from EC2 instance in routable subnet of VPC A",
    );

    /**
     * Note that after a successful deployment it takes up to a couple minutes for this instance to be able to connect to the
     * EC2 instance in the Non-Routable Subnet of VPC B. So if you don't see the last `echo` statement from the above User Data
     * then wait a couple of minutes and try the request again.
     */
    const vpcAPrivateInstanceName = `privateInstanceVpcA-${props.scope}`;
    const vpcAPrivateInstance = new cdk.aws_ec2.Instance(
      this,
      "privateInstanceVpcA",
      {
        vpcSubnets: {
          subnets: [privateNonRoutableSubnetVpcA],
        },
        vpc: vpcA,
        securityGroup: vpcAPrivateInstanceSecurityGroup,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO,
        ),
        machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
        userData: userDataPrivate,
        instanceName: vpcAPrivateInstanceName,
      },
    );
    vpcAPrivateInstance.node.addDependency(vpcBInstance);
    vpcAPrivateInstance.node.addDependency(alb);
    // It takes a few minutes for the instance to return the full message so does this EC2 instance need a depenency on the Transit Gateway?

    /**
     * 28. Deploy an EC2 intance into the Routable Subnet of VPC A. The goal of this instance
     * is to allow users to connect to it and make a request to the EC2 instance in the
     * Non-Routable Subnet of VPC A.
     */
    const userDataRoutableEc2InstanceVpcA = cdk.aws_ec2.UserData.forLinux();
    // This list of commands was copied from Stephane Maarek's AWS Certified Associate DVA-C01 Udemy Course
    userDataRoutableEc2InstanceVpcA.addCommands(
      "#!/bin/bash",
      "yum update -y",
      "yum install -y httpd",
      "systemctl start httpd",
      "systemctl enable httpd",
      'echo "<h1>Hello world from $(hostname -f)</h1>" > /var/www/html/index.html',
      `echo "<h1>Connecting to VPC B Private Instance (${vpcBPrivateInstance}) via 'VPC A Private Instance -> Private NAT Gateway -> Transit Gateway -> ALB' from $(hostname -f)</h1>" >> /var/www/html/index.html`,
      `echo "<h1>Response from ${vpcAPrivateInstanceName}: '$(curl --location ${vpcAPrivateInstance.instancePrivateIp})'</h1>" >> /var/www/html/index.html`,
    );

    const vpcAPublicInstance = new cdk.aws_ec2.Instance(
      this,
      "publicInstanceVpcA",
      {
        vpcSubnets: {
          subnets: [publicSubnetVpcA],
        },
        vpc: vpcA,
        securityGroup: openTrafficSecurityGroup,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO,
        ),
        machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
        userData: userDataRoutableEc2InstanceVpcA,
        instanceName: `publicInstanceVpcA-${props.scope}`,
      },
    );
    vpcAPublicInstance.node.addDependency(vpcAPrivateInstance);

    new cdk.CfnOutput(this, "nonRoutableEc2VpcA", {
      description:
        "Private IP of the EC2 instance in the Non-Routable Subnet of VPC A",
      value: vpcAPrivateInstance.instancePrivateIp,
      exportName: `nonRoutableEc2VpcAPrivateIp-${props.scope}`,
    });

    new cdk.CfnOutput(this, "routableEc2VpcA", {
      description: "Public IP of the EC2 instance in Routable Subnet of VPC A",
      value: vpcAPublicInstance.instancePublicIp,
      exportName: `routableEc2VpcAPublicIp-${props.scope}`,
    });
  }
}
