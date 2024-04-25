import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployVpcToVpcPeeringStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployVpcToVpcPeeringStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployVpcToVpcPeeringStackProps,
  ) {
    super(scope, id, props);

    /**
     * 1. Deploy two VPCs. They will be able to communicate via Peering Connection.
     * The VPCs must not have overlapping CIDRs.
     *
     * The main VPC only has a Public Subnet, this subnet's Route Table will be
     * used later.
     *
     * The second VPC has a Public Subnet, and a Private with Egress Subnet. This
     * subnet's Route Table will be used later.
     */
    const mainVpc = new cdk.aws_ec2.Vpc(this, "mainVpc", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr("10.0.0.0/16"),
      availabilityZones: [`${props.env!.region!}a`],
      subnetConfiguration: [
        {
          cidrMask: 20,
          name: `public-${props.scope}`,
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const peeredVpc = new cdk.aws_ec2.Vpc(this, "peeredVpc", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr("11.0.0.0/16"),
      availabilityZones: [`${props.env!.region!}a`],
      subnetConfiguration: [
        {
          cidrMask: 20,
          name: `peeredPublic-${props.scope}`,
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 20,
          name: `peeredPrivateEgress-${props.scope}`,
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    /**
     * 2. Connect the two VPCs using a Peering Connection.
     */
    const vpcPeeringConnection = new cdk.aws_ec2.CfnVPCPeeringConnection(
      this,
      "peeringConnection",
      {
        peerVpcId: peeredVpc.vpcId,
        vpcId: mainVpc.vpcId,
      },
    );

    /**
     * 3. Update the Route Table in the Main VPC's Public Subnet to direct
     * traffic to the Private with Egress Subnet of the Peered VPC through the
     * Peering Connection. This is what allows the Main VPC to make a request to
     * the Peered VPC.
     */
    new cdk.aws_ec2.CfnRoute(this, "vpcPublicToPeeredVpc", {
      destinationCidrBlock: peeredVpc.privateSubnets[0].ipv4CidrBlock,
      routeTableId: mainVpc.publicSubnets[0].routeTable.routeTableId,
      vpcPeeringConnectionId: vpcPeeringConnection.attrId,
    });

    /**
     * 4. Update the Route Table in the Peered VPC's Private with Egress Subnet to
     * direct traffic to the Publuc Subnet og the Main VPC through the
     * Peering Connection. This is what allows the Peered VPC to respond to the
     * Main VPC.
     */
    new cdk.aws_ec2.CfnRoute(this, "peeredVpcToVpcPublic", {
      destinationCidrBlock: mainVpc.publicSubnets[0].ipv4CidrBlock,
      routeTableId: peeredVpc.privateSubnets[0].routeTable.routeTableId,
      vpcPeeringConnectionId: vpcPeeringConnection.attrId,
    });

    /**
     * 5. Create a Security Group, User Data, and an EC2 Instance in the Peered VPC.
     */
    const peeredVpcSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "peeredVpcSecurityGroup",
      {
        securityGroupName: `peeredVpcSecurityGroup-${props.scope}`,
        description: "Peered VPC Private with Egress Subnet",
        vpc: peeredVpc,
      },
    );
    peeredVpcSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.ipv4(mainVpc.publicSubnets[0].ipv4CidrBlock),
      cdk.aws_ec2.Port.tcp(80),
      "Allow TCP traffic on Port 80 from the Public Subnet of the Main VPC",
    );
    const userDataPeeredVpc = cdk.aws_ec2.UserData.forLinux();
    // This list of commands was copied from Stephane Maarek's AWS Certified Associate DVA-C01 Udemy Course
    userDataPeeredVpc.addCommands(
      "#!/bin/bash",
      "yum update -y",
      "yum install -y httpd",
      "systemctl start httpd",
      "systemctl enable httpd",
      'echo "Hello world from $(hostname -f)" > /var/www/html/index.html',
    );
    const vpcPeeringPrivateEgressInstance = new cdk.aws_ec2.Instance(
      this,
      "vpcPeeringPrivateEgress",
      {
        vpcSubnets: {
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        vpc: peeredVpc,
        securityGroup: peeredVpcSecurityGroup,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO,
        ),
        machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
        userData: userDataPeeredVpc,
        instanceName: `vpcPeeringPrivateEgress-${props.scope}`,
      },
    );

    /**
     * 6. Create a Security Group, User Data, and an EC2 Instance in the Main VPC.
     */
    const mainVpcSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "vpcSecurityGroup",
      {
        securityGroupName: `vpcSecurityGroup-${props.scope}`,
        description: "Allow all traffic",
        vpc: mainVpc,
      },
    );
    mainVpcSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.allTraffic(),
      "Allow all traffic",
    );

    const userDataMainVpc = cdk.aws_ec2.UserData.forLinux();
    // This list of commands was copied from Stephane Maarek's AWS Certified Associate DVA-C01 Udemy Course
    userDataMainVpc.addCommands(
      "#!/bin/bash",
      "yum update -y",
      "yum install -y httpd",
      "systemctl start httpd",
      "systemctl enable httpd",
      'echo "Hello world from $(hostname -f)" > /var/www/html/index.html',
      `echo "Response from: '$(curl --location ${vpcPeeringPrivateEgressInstance.instancePrivateIp})'" >> /var/www/html/index.html`,
    );
    const mainVpcPublicInstance = new cdk.aws_ec2.Instance(
      this,
      "mainVpcPublic",
      {
        vpcSubnets: {
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
        vpc: mainVpc,
        securityGroup: mainVpcSecurityGroup,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO,
        ),
        machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
        userData: userDataMainVpc,
        instanceName: `vpcPublic-${props.scope}`,
      },
    );
    mainVpcPublicInstance.node.addDependency(vpcPeeringPrivateEgressInstance);

    new cdk.CfnOutput(this, "privateIpPeeredInstance", {
      description: "Private IP of the EC2 instance in the Peered VPC",
      value: vpcPeeringPrivateEgressInstance.instancePrivateIp,
      exportName: `peeredPrivateIp-${props.scope}`,
    });

    new cdk.CfnOutput(this, "publicIpVpcInstance", {
      description: "Public IP of the EC2 instance in the Main VPC",
      value: mainVpcPublicInstance.instancePublicIp,
      exportName: `publicIpMainVpc-${props.scope}`,
    });
  }
}
