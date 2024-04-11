import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface DeployVpcToVpcNatGatewayStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployVpcToVpcNatGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeployVpcToVpcNatGatewayStackProps) {
    super(scope, id, props);

    const tags = [new cdk.Tag("scope", props.scope)];

    const availabilityZoneA = `${props.env!.region!}a`;
    const availabilityZoneB = `${props.env!.region!}b`;

    /**
     * VPC A
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

    const nonRouteableCidr = '100.0.0.0/16'
    const nonRouteableCidrBlock = new cdk.aws_ec2.CfnVPCCidrBlock(this, "secondCidrBlock", {
      cidrBlock: nonRouteableCidr,
      vpcId: vpcA.vpcId
    })

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
     * VPC A Public Subnet
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
     * Add second CIDR to VPC and make it a non-routable subnet
     */
    const privateNonRoutableSubnetVpcA = new cdk.aws_ec2.Subnet(this, "privateNonRoutableSubnetVpcA", {
      availabilityZone: availabilityZoneA,
      vpcId: vpcA.vpcId,
      cidrBlock: nonRouteableCidr,
      mapPublicIpOnLaunch: true,
    });
    privateNonRoutableSubnetVpcA.node.addDependency(nonRouteableCidrBlock);

    const privateNatGateway = new cdk.aws_ec2.CfnNatGateway(this, 'privateNatGateway', {
      connectivityType: "private",
      subnetId: publicSubnetVpcA.subnetId,
      tags: tags
    });

    /**
     * Public NAT Gateway for routable subnet
     */
    const eipA = new cdk.aws_ec2.CfnEIP(this, "elasticIpA", {
      tags: tags,
    });

    const publicNatGatewayA = new cdk.aws_ec2.CfnNatGateway(this, 'publicNatGatewayA', {
      allocationId: eipA.attrAllocationId,
      subnetId: publicSubnetVpcA.subnetId,
      tags: tags
    });

    const privateRoutableToNatGatewayVpcA = new cdk.aws_ec2.CfnRoute(this, "privateRoutableToNatGatewayVpcA", {
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: publicNatGatewayA.attrNatGatewayId,
      routeTableId: privateNonRoutableSubnetVpcA.routeTable.routeTableId,
    });

    // This CIDR is the lower half of VPC As public subnet CIDR
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
     * VPC B PUBLIC SUBNET
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
     * Second empty subnet for ALB
     */
    const privateSubnetVpcBForAlb = new cdk.aws_ec2.Subnet(this, "privateSubnetVpcBForAlb", {
      availabilityZone: availabilityZoneB,
      vpcId: vpcB.vpcId,
      cidrBlock: "11.0.1.0/24",
      mapPublicIpOnLaunch: true,
    });

    /**
     * Other Subnets
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

    const nonRouteableCidrBlockVpcB = new cdk.aws_ec2.CfnVPCCidrBlock(this, "secondCidrBlockVpcB", {
      cidrBlock: nonRouteableCidr,
      vpcId: vpcB.vpcId
    })

    // Link to the GitHub
    // Add second CIDR to VPC B
    const privateNonRoutableSubnetVpcB = new cdk.aws_ec2.Subnet(this, "privateNonRoutableSubnetVpcB", {
      availabilityZone: availabilityZoneA,
      vpcId: vpcB.vpcId,
      cidrBlock: nonRouteableCidr,
      mapPublicIpOnLaunch: true,
    });
    privateNonRoutableSubnetVpcB.node.addDependency(nonRouteableCidrBlockVpcB);

    const eip = new cdk.aws_ec2.CfnEIP(this, "elasticIp", {
      tags: tags,
    });

    const publicNatGatewayB = new cdk.aws_ec2.CfnNatGateway(this, 'publicNatGatewayB', {
      allocationId: eip.attrAllocationId,
      subnetId: publicSubnetVpcB.subnetId,
      tags: tags
    });

    const privateNonRoutableToNatGatewayVpcB = new cdk.aws_ec2.CfnRoute(this, "privateNonRoutableToNatGatewayVpcB", {
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: publicNatGatewayB.attrNatGatewayId,
      routeTableId: privateNonRoutableSubnetVpcB.routeTable.routeTableId,
    });


    const transitGateway = new cdk.aws_ec2.CfnTransitGateway(
      this,
      "transitGateway",
      {
        defaultRouteTableAssociation: 'disable',
        defaultRouteTablePropagation: 'disable',
        description: "Transit Gateway connecting VPC A and VPC B",
        tags: tags,
      },
    );

    const transitGatewayRouteTable = new cdk.aws_ec2.CfnTransitGatewayRouteTable(
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

    new cdk.aws_ec2.CfnTransitGatewayRouteTableAssociation(this, 'routeTableAssociationVpcA', {
      transitGatewayAttachmentId: transitGatewayAttachmentVpcA.attrId,
      transitGatewayRouteTableId: transitGatewayRouteTable.attrTransitGatewayRouteTableId,
    })
  
  const vpcATransitGatewayRoute = new cdk.aws_ec2.CfnTransitGatewayRoute(this, 'vpcAROute', {
    destinationCidrBlock: publicSubnetVpcACidr,
    transitGatewayAttachmentId: transitGatewayAttachmentVpcA.attrId,
    transitGatewayRouteTableId: transitGatewayRouteTable.attrTransitGatewayRouteTableId,
  })

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
    
    new cdk.aws_ec2.CfnTransitGatewayRouteTableAssociation(this, 'routeTableAssociationVpcB', {
      transitGatewayAttachmentId: transitGatewayAttachmentVpcB.attrId,
      transitGatewayRouteTableId: transitGatewayRouteTable.attrTransitGatewayRouteTableId,
    })

    const vpcBTransitGatewayRoute =new cdk.aws_ec2.CfnTransitGatewayRoute(this, 'vpcBROute', {
      destinationCidrBlock: privateRoutableCidrVpcB,
      transitGatewayAttachmentId: transitGatewayAttachmentVpcB.attrId,
      transitGatewayRouteTableId: transitGatewayRouteTable.attrTransitGatewayRouteTableId,
    })

    const privateNonRoutableToNatGatewayVpcA = new cdk.aws_ec2.CfnRoute(this, "privateNonRoutableToNatGatewayVpcA", {
      destinationCidrBlock: privateRoutableCidrVpcB,
      natGatewayId: privateNatGateway.attrNatGatewayId,
      routeTableId: privateNonRoutableSubnetVpcA.routeTable.routeTableId,
    });
    privateNonRoutableToNatGatewayVpcA.addDependency(privateNatGateway);
    privateNonRoutableToNatGatewayVpcA.addDependency(transitGatewayAttachmentVpcB);
    privateNonRoutableToNatGatewayVpcA.addDependency(transitGatewayAttachmentVpcA);
    privateNonRoutableToNatGatewayVpcA.addDependency(transitGateway);

    const privateRoutableToTransitGatewayVpcA = new cdk.aws_ec2.CfnRoute(this, "privateRoutableToTransitGatewayVpcA", {
      destinationCidrBlock: privateRoutableCidrVpcB,
      transitGatewayId: transitGateway.attrId,
      routeTableId: publicSubnetVpcA.routeTable.routeTableId,
    });
    privateRoutableToTransitGatewayVpcA.addDependency(transitGatewayAttachmentVpcA);
    privateRoutableToTransitGatewayVpcA.addDependency(transitGatewayAttachmentVpcB);
    privateRoutableToTransitGatewayVpcA.addDependency(transitGateway);

    const privateRoutableToTransitGatewayVpcB = new cdk.aws_ec2.CfnRoute(this, "privateRoutableToTransitGatewayVpcB", {
      destinationCidrBlock: publicSubnetVpcACidr,
      transitGatewayId: transitGateway.attrId,
      routeTableId: privateRoutableSubnetVpcB.routeTable.routeTableId,
    });
    privateRoutableToTransitGatewayVpcB.addDependency(transitGatewayAttachmentVpcB);
    privateRoutableToTransitGatewayVpcB.addDependency(transitGatewayAttachmentVpcA);
    privateRoutableToTransitGatewayVpcB.addDependency(transitGateway);


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
    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(this, 'albVpcB', {
      securityGroup: securityGroupVpcB,
      loadBalancerName: `vpcB-${props.scope}`,
      vpc: vpcB,
      vpcSubnets: {
        subnets: [privateRoutableSubnetVpcB, privateSubnetVpcBForAlb]
      },
    })

    const vpcBPrivateInstance = `ec2InstanceBPrivate-${props.scope}`
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
    const vpcBInstance = new cdk.aws_ec2.Instance(this, 'vpcInstance', {
      vpcSubnets: {
        subnets: [privateNonRoutableSubnetVpcB]
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
    })

    const listener = alb.addListener('ec2', {
      port: 80
    })
    const instance1Target =
      new cdk.aws_elasticloadbalancingv2_targets.InstanceTarget(vpcBInstance);
    listener.addTargets('targets', {
      targets: [instance1Target],
      port: 80
    })


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

    const vpcAPublicInstance = new cdk.aws_ec2.Instance(this, 'vpcInstancePublicA', {
      vpcSubnets: {
        subnets: [publicSubnetVpcA]
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
    })


    const userDataPrivate = cdk.aws_ec2.UserData.forLinux();
    // This list of commands was copied from Stephane Maarek's AWS Certified Associate DVA-C01 Udemy Course
    userDataPrivate.addCommands(
      "#!/bin/bash",
      "yum update -y",
      "yum install -y httpd",
      "systemctl start httpd",
      "systemctl enable httpd",
      `echo "<h1>Load Balancer DNS ${alb.loadBalancerDnsName}</h1>" > /var/www/html/index.html`,
      `echo "<h1>Private IP Private Instance ${vpcBInstance.instancePrivateIp}</h1>" >> /var/www/html/index.html`,
      //`echo "<h1>Hello world from $(curl --location ${vpcBInstance.instancePrivateIp})</h1>" >> /var/www/html/index.html`,
      //`echo "<h1>Hello world from $(ping ${alb.loadBalancerDnsName})</h1>" >> /var/www/html/index.html`,
      `echo "<h1>Connecting to VPC B Private Instance (${vpcBPrivateInstance})</h1>" >> /var/www/html/index.html`,
      `echo "<h1>Response from ${vpcBPrivateInstance}: '$(curl --location ${alb.loadBalancerDnsName})'</h1>" >> /var/www/html/index.html`,
    );

    const vpcAPrivateInstance = new cdk.aws_ec2.Instance(this, 'vpcInstancePrivateA', {
      vpcSubnets: {
        subnets: [privateNonRoutableSubnetVpcA]
      },
      vpc: vpcA,
      securityGroup: securityGroupVpcA,
      instanceType: cdk.aws_ec2.InstanceType.of(
        cdk.aws_ec2.InstanceClass.T2,
        cdk.aws_ec2.InstanceSize.MICRO,
      ),
      machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
      userData: userDataPrivate,
      // test this
      userDataCausesReplacement: true,
      instanceName: `ec2InstanceAPrivate-${props.scope}`,
    })
    vpcAPrivateInstance.node.addDependency(vpcBInstance)
    vpcAPrivateInstance.node.addDependency(alb)
    // add depenency on transit gateway maybe?
    // it also takes a few minutes for the instance to fully return the full message
    


    /**
     * ECS
     * 
     * 
     * 
     * 
     * Don't use ECS, they can't download image from ECR registry
     */
    // const securityGroupVpcA = new cdk.aws_ec2.SecurityGroup(
    //   this,
    //   "securityGroupVpcA",
    //   {
    //     securityGroupName: `ec2InstanceVpcA-${props.scope}`,
    //     description: "Allow all traffic",
    //     vpc: vpcA,
    //   },
    // );
    // securityGroupVpcA.addIngressRule(
    //   cdk.aws_ec2.Peer.anyIpv4(),
    //   cdk.aws_ec2.Port.allTraffic(),
    //   "Allow all",
    // );

    // const clusterVpcA = new cdk.aws_ecs.Cluster(this, "clusterVpcA", {
    //   clusterName: `vpcA-${props.scope}`,
    //   vpc: vpcA,
    //   enableFargateCapacityProviders: true,
    // });

    // const fargateTaskDef = new cdk.aws_ecs.FargateTaskDefinition(
    //   this,
    //   "fargateTaskDefinition",
    //   {
    //     cpu: 256,
    //     memoryLimitMiB: 512,
    //     family: `ecsWithFargateFamily-${props.scope}`,
    //   }
    // );
    // fargateTaskDef.addContainer("apiContainer", {
    //   image: cdk.aws_ecs.ContainerImage.fromAsset("../api"),
    //   essential: true,
    //   portMappings: [
    //     {
    //       containerPort: 8080,
    //     },
    //   ],
    //   logging: cdk.aws_ecs.LogDrivers.awsLogs({
    //     streamPrefix: `vpcALogs-${props.scope}`,
    //     logGroup: new cdk.aws_logs.LogGroup(this, "logGroup", {
    //       logGroupName: `/ecs-with-fargate-api/${props.scope}`,
    //       retention: cdk.aws_logs.RetentionDays.ONE_DAY,
    //       removalPolicy: cdk.RemovalPolicy.DESTROY,
    //     }),
    //   }),
    // });

    // new cdk.aws_ecs.FargateService(this, "fargateServicePublic", {
    //   taskDefinition: fargateTaskDef,
    //   assignPublicIp: true,
    //   vpcSubnets: vpcA.selectSubnets({
    //     subnets: [publicSubnetVpcA],
    //   }),
    //   cluster: clusterVpcA,
    //   desiredCount: 1,
    //   serviceName: `fargateServicePublic-${props.scope}`,
    //   platformVersion: cdk.aws_ecs.FargatePlatformVersion.VERSION1_4,
    //   securityGroups: [securityGroupVpcA],
    // });

    // new cdk.aws_ecs.FargateService(this, "fargateServicePrivateIsolated", {
    //   taskDefinition: fargateTaskDef,
    //   assignPublicIp: true,
    //   vpcSubnets: vpcA.selectSubnets({
    //     subnets: [privateNonRoutableSubnetVpcA],
    //   }),
    //   cluster: clusterVpcA,
    //   desiredCount: 1,
    //   serviceName: `fargateServiceIsolated-${props.scope}`,
    //   platformVersion: cdk.aws_ecs.FargatePlatformVersion.VERSION1_4,
    //   securityGroups: [securityGroupVpcA],
    // });

    // new cdk.aws_ecs.FargateService(this, "fargateServicePrivateRoutable", {
    //   taskDefinition: fargateTaskDef,
    //   assignPublicIp: true,
    //   vpcSubnets: vpcA.selectSubnets({
    //     subnets: [privateRoutableSubnetVpcA],
    //   }),
    //   cluster: clusterVpcA,
    //   desiredCount: 1,
    //   serviceName: `fargateServiceRoutable-${props.scope}`,
    //   platformVersion: cdk.aws_ecs.FargatePlatformVersion.VERSION1_4,
    //   securityGroups: [securityGroupVpcA],
    // });
  }
}
