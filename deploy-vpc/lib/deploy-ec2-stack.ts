import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployEc2StackProps extends cdk.StackProps {
  scope: string;
  vpcL1: cdk.aws_ec2.CfnVPC;
  publicSubnet: cdk.aws_ec2.CfnSubnet;
  privateWithEgressSubnet: cdk.aws_ec2.CfnSubnet;
  privateIsolatedSubnet: cdk.aws_ec2.CfnSubnet;
  stackTags: {
    [key: string]: string;
  };
}

export class DeployEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeployEc2StackProps) {
    super(scope, id, props);

    // Using tags because of https://github.com/aws/aws-cdk/issues/14809
    // tags aren't unique so deploying and then deleting deployment
    // may return wrong VPC
    const vpc = cdk.aws_ec2.Vpc.fromLookup(this, "vpcL2", {
      tags: props.stackTags,
      isDefault: false,
    });

    const securityGroup = new cdk.aws_ec2.SecurityGroup(this, "securityGroup", {
      securityGroupName: `ec2InstanceSecurityGroup-${props.scope}`,
      description: "Allow all traffic",
      vpc,
    });
    securityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.allTraffic(),
      "Allow all",
    );

    const userData = cdk.aws_ec2.UserData.forLinux();
    /**
     * NOTE/WARNING: These commands will FAIL on the EC2 instance located in the PRIVATE_ISOLATED subnet.
     *
     * The isolated private subnet has no route to the public internet and is therefore not able to update
     * or install any external software. For this reason the EC2 instance in the isolated subnet will not
     * have an httpd server installed on it, meaning that all `curl` commands will fail, but `ping` will
     * still continue to work from within the VPC.
     */
    // This list of commands was copied from Stephane Maarek's AWS Certified Associate DVA-C01 Udemy Course
    userData.addCommands(
      "#!/bin/bash",
      "yum update -y",
      "yum install -y httpd",
      "systemctl start httpd",
      "systemctl enable httpd",
      'echo "<h1>Hello world from $(hostname -f)</h1>" > /var/www/html/index.html',
    );

    const publicSubnet = cdk.aws_ec2.Subnet.fromSubnetAttributes(
      this,
      "publicSubnet",
      {
        availabilityZone: props.publicSubnet.attrAvailabilityZone,
        subnetId: props.publicSubnet.attrSubnetId,
      },
    );

    const publicInstance = new cdk.aws_ec2.Instance(this, "publicInstance", {
      vpcSubnets: {
        subnets: [publicSubnet],
      },
      allowAllOutbound: true,
      vpc: vpc,
      securityGroup: securityGroup,
      instanceType: cdk.aws_ec2.InstanceType.of(
        cdk.aws_ec2.InstanceClass.T2,
        cdk.aws_ec2.InstanceSize.MICRO,
      ),
      machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
      userData: userData,
      instanceName: `public-${props.scope}`,
    });

    const privateWithEgressSubnet = cdk.aws_ec2.Subnet.fromSubnetAttributes(
      this,
      "privateWithEgressSubnet",
      {
        availabilityZone: props.privateWithEgressSubnet.attrAvailabilityZone,
        subnetId: props.privateWithEgressSubnet.attrSubnetId,
      },
    );

    const privateWithEgressInstance = new cdk.aws_ec2.Instance(
      this,
      "privateWithEgressInstance",
      {
        vpcSubnets: {
          subnets: [privateWithEgressSubnet],
        },
        allowAllOutbound: true,
        vpc: vpc,
        securityGroup: securityGroup,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO,
        ),
        machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
        userData: userData,
        instanceName: `privateWithEgress-${props.scope}`,
      },
    );

    const privateIsolatedSubnet = cdk.aws_ec2.Subnet.fromSubnetAttributes(
      this,
      "privateIsolatedSubnet",
      {
        availabilityZone: props.privateIsolatedSubnet.attrAvailabilityZone,
        subnetId: props.privateIsolatedSubnet.attrSubnetId,
      },
    );

    const privateIsolatedInstance = new cdk.aws_ec2.Instance(
      this,
      "privateIsolatedInstance",
      {
        vpcSubnets: {
          subnets: [privateIsolatedSubnet],
        },
        allowAllOutbound: true,
        vpc: vpc,
        securityGroup: securityGroup,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO,
        ),
        machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
        userData: userData,
        instanceName: `privateIsolated-${props.scope}`,
      },
    );

    /*new cdk.CfnOutput(this, "publicIp", {
      description: "Public IP of the EC2 instance",
      value: instance.instancePublicIp,
      exportName: `ec2InstancePublicIp-${props.scope}`,
    });

    new cdk.CfnOutput(this, "publicDnsName", {
      description: "Public DNS name of the EC2 instance",
      value: instance.instancePublicDnsName,
      exportName: `ec2InstancePublicDnsName-${props.scope}`,
    });*/
  }
}
