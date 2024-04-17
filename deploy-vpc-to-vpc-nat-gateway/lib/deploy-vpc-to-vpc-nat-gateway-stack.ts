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
     * 2. Create a non-routable subnet in VPC A. This subnet has the same CIDR as the non-routable
     * subnet in VPC B.
     *
     * The CDK doesn't really support VPCs with multiple CIDRs so they have to be created
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
     * 5. Create a private non-routable subnet in VPC A.
     * https://github.com/aws/aws-cdk/issues/9573
     * Add second CIDR to VPC and make it a non-routable subnet
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
     * 6. Create a Private NAT Gateway. This Private NAT Gateway will allow the non-routable
     * subnet to communicate with the other non-routable subnet in VPC B.
     */
    const privateNatGateway = new cdk.aws_ec2.CfnNatGateway(
      this,
      "privateNatGateway",
      {
        connectivityType: "private",
        subnetId: publicSubnetVpcA.subnetId,
        tags: tags,
      },
    );

    /**
     * 7. Public NAT Gateway for routable subnet
     */
    const eipA = new cdk.aws_ec2.CfnEIP(this, "elasticIpA", {
      tags: tags,
    });

    const publicNatGatewayA = new cdk.aws_ec2.CfnNatGateway(
      this,
      "publicNatGatewayA",
      {
        allocationId: eipA.attrAllocationId,
        subnetId: publicSubnetVpcA.subnetId,
        tags: tags,
      },
    );

    const privateRoutableToNatGatewayVpcA = new cdk.aws_ec2.CfnRoute(
      this,
      "privateRoutableToNatGatewayVpcA",
      {
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: publicNatGatewayA.attrNatGatewayId,
        routeTableId: privateNonRoutableSubnetVpcA.routeTable.routeTableId,
      },
    );

    /**
     * 8.  Create VPC B. VPC B will also have a non-routalbe subnet with the same CIDR
     * as VPC A's non-routable subnet.
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
     * the EC2 Instanced in the non-routable subnet to download an HTTP server.
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
     * 10. Create a Public Subnet in VPC B.
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
     * the ALB must be connected to two subnets.
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
     * 13. Create a non-routable subnet in VPC B. This subnet has the same CIDR as the non-routable
     * subnet in VPC B.
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
     * 14. Create a Private NAT Gateway to allow the non-routalbe subnet access to the internet to
     * download the HTTP Server.
     */
    const eip = new cdk.aws_ec2.CfnEIP(this, "elasticIp", {
      tags: tags,
    });

    const publicNatGatewayB = new cdk.aws_ec2.CfnNatGateway(
      this,
      "publicNatGatewayB",
      {
        allocationId: eip.attrAllocationId,
        subnetId: publicSubnetVpcB.subnetId,
        tags: tags,
      },
    );

    const privateNonRoutableToNatGatewayVpcB = new cdk.aws_ec2.CfnRoute(
      this,
      "privateNonRoutableToNatGatewayVpcB",
      {
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: publicNatGatewayB.attrNatGatewayId,
        routeTableId: privateNonRoutableSubnetVpcB.routeTable.routeTableId,
      },
    );

    /**
     * 15. Create a Transit Gateway.
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
    const vpcATransitGatewayRoute = new cdk.aws_ec2.CfnTransitGatewayRoute(
      this,
      "vpcAROute",
      {
        destinationCidrBlock: publicSubnetVpcACidr,
        transitGatewayAttachmentId: transitGatewayAttachmentVpcA.attrId,
        transitGatewayRouteTableId:
          transitGatewayRouteTable.attrTransitGatewayRouteTableId,
      },
    );

    /**
     * 21. Attach the the Transit Gateway to VPC A
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
     * 22. Associate the Transit Gateway Route Table with the VPC B Transit Gateway Attachment.
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
     * 23. Create a Transit Gateway Route from VPC B to the Routable Subnet of VPC A
     */
    const vpcBTransitGatewayRoute = new cdk.aws_ec2.CfnTransitGatewayRoute(
      this,
      "vpcBROute",
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
     * EC2 instance in the non-routable subnet in VPC B
     */
    new cdk.aws_ec2.CfnRoute(
      this,
      "privateNonRoutableToNatGatewayVpcA",
      {
        destinationCidrBlock: privateRoutableCidrVpcB,
        natGatewayId: privateNatGateway.attrNatGatewayId,
        routeTableId: privateNonRoutableSubnetVpcA.routeTable.routeTableId,
      },
    );

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
     * Deploy ALB. The ALB sends traffic from the routable subnet to the EC2 instance in the
     * non-routable subnet.
     */
    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      this,
      "albVpcB",
      {
        securityGroup: securityGroupVpcB,
        loadBalancerName: `vpcB-${props.scope}`,
        vpc: vpcB,
        vpcSubnets: {
          subnets: [privateRoutableSubnetVpcB, privateSubnetVpcBForAlb],
        },
      },
    );

    const vpcBPrivateInstance = `ec2InstanceBPrivate-${props.scope}`;
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
    const vpcBInstance = new cdk.aws_ec2.Instance(this, "vpcInstance", {
      vpcSubnets: {
        subnets: [privateNonRoutableSubnetVpcB],
      },
      vpc: vpcB,
      securityGroup: securityGroupVpcB,
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
    });
    const instance1Target =
      new cdk.aws_elasticloadbalancingv2_targets.InstanceTarget(vpcBInstance);
    listener.addTargets("targets", {
      targets: [instance1Target],
      port: 80,
    });

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

    const vpcAPublicInstance = new cdk.aws_ec2.Instance(
      this,
      "vpcInstancePublicA",
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
        userData,
        instanceName: `ec2InstancePublicA-${props.scope}`,
      },
    );

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
      `echo "<h1>Load Balancer DNS ${alb.loadBalancerDnsName}</h1>" > /var/www/html/index.html`,
      `echo "<h1>Private IP Private Instance ${vpcBInstance.instancePrivateIp}</h1>" >> /var/www/html/index.html`,
      `echo "<h1>Connecting to VPC B Private Instance (${vpcBPrivateInstance})</h1>" >> /var/www/html/index.html`,
      `echo "<h1>Response from ${vpcBPrivateInstance}: '$(curl --location ${alb.loadBalancerDnsName})'</h1>" >> /var/www/html/index.html`,
    );

    
    const vpcAPrivateInstance = new cdk.aws_ec2.Instance(
      this,
      "vpcInstancePrivateA",
      {
        vpcSubnets: {
          subnets: [privateNonRoutableSubnetVpcA],
        },
        vpc: vpcA,
        securityGroup: securityGroupVpcA,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO,
        ),
        machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
        userData: userDataPrivate,
        instanceName: `ec2InstanceAPrivate-${props.scope}`,
      },
    );
    vpcAPrivateInstance.node.addDependency(vpcBInstance);
    vpcAPrivateInstance.node.addDependency(alb);
    // add depenency on transit gateway maybe?
    // it also takes a few minutes for the instance to fully return the full message
  }
}
