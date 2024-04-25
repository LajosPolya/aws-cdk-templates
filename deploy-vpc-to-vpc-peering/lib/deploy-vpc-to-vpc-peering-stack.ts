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
    const vpc = new cdk.aws_ec2.Vpc(this, "vpc", {
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
        vpcId: vpc.vpcId,
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
      routeTableId: vpc.publicSubnets[0].routeTable.routeTableId,
      vpcPeeringConnectionId: vpcPeeringConnection.attrId,
    });

    /**
     * 4. Update the Route Table in the Peered VPC's Private with Egress Subnet to
     * direct traffic to the Publuc Subnet og the Main VPC through the
     * Peering Connection. This is what allows the Peered VPC to respond to the
     * Main VPC.
     */
    new cdk.aws_ec2.CfnRoute(this, "peeredVpcToVpcPublic", {
      destinationCidrBlock: vpc.publicSubnets[0].ipv4CidrBlock,
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
        description: "Allow all traffic from ALB",
        vpc: peeredVpc,
      },
    );
    peeredVpcSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.allTraffic(),
      "Allow all traffic",
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
    const vpcSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "vpcSecurityGroup",
      {
        securityGroupName: `vpcSecurityGroup-${props.scope}`,
        description: "Allow all traffic from ALB",
        vpc: vpc,
      },
    );
    vpcSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.allTraffic(),
      "Allow all traffic",
    );

    const userDataVpc = cdk.aws_ec2.UserData.forLinux();
    // This list of commands was copied from Stephane Maarek's AWS Certified Associate DVA-C01 Udemy Course
    userDataVpc.addCommands(
      "#!/bin/bash",
      "yum update -y",
      "yum install -y httpd",
      "systemctl start httpd",
      "systemctl enable httpd",
      'echo "Hello world from $(hostname -f)" > /var/www/html/index.html',
      `echo "Response from: '$(curl --location ${vpcPeeringPrivateEgressInstance.instancePrivateIp})'" >> /var/www/html/index.html`,
    );
    const vpcPublicInstance = new cdk.aws_ec2.Instance(this, "vpcPublic", {
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
      },
      vpc: vpc,
      securityGroup: vpcSecurityGroup,
      instanceType: cdk.aws_ec2.InstanceType.of(
        cdk.aws_ec2.InstanceClass.T2,
        cdk.aws_ec2.InstanceSize.MICRO,
      ),
      machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
      userData: userDataVpc,
      instanceName: `vpcPublic-${props.scope}`,
    });
    vpcPublicInstance.node.addDependency(vpcPeeringPrivateEgressInstance);

    new cdk.CfnOutput(this, "privateIpPeeredInstance", {
      description: "Private IP of the EC2 instance in the Peered VPC",
      value: vpcPeeringPrivateEgressInstance.instancePrivateIp,
      exportName: `privateIpPeeredInstance-${props.scope}`,
    });

    new cdk.CfnOutput(this, "publicIpVpcInstance", {
      description: "Public IP of the EC2 instance in the owning VPC",
      value: vpcPublicInstance.instancePublicIp,
      exportName: `publicIpVpcInstance-${props.scope}`,
    });
  }
}
