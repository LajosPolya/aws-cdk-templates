import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployVpcL2StackProps extends cdk.StackProps {
  scope: string;
}

export class DeployVpcL2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeployVpcL2StackProps) {
    super(scope, id, props);

    const vpc = new cdk.aws_ec2.Vpc(this, "vpc", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(
        cdk.aws_ec2.Vpc.DEFAULT_CIDR_RANGE,
      ),
      availabilityZones: [`${props.env!.region!}a`],
      subnetConfiguration: [
        {
          cidrMask: 20,
          name: `public-${props.scope}`,
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 20,
          name: `privateEgress-${props.scope}`,
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 20,
          name: `privateIsolated-${props.scope}`,
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    const securityGroup = new cdk.aws_ec2.SecurityGroup(this, "securityGroup", {
      securityGroupName: `ec2InstanceSecurityGroup-${props.scope}`,
      description: "Allow all traffic",
      vpc,
    });
    securityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.allTraffic(),
      "Allow all traffic",
    );

    const userData = cdk.aws_ec2.UserData.forLinux();
    /**
     * NOTE/WARNING: These commands will FAIL on the EC2 instance located in the PRIVATE_ISOLATED subnet.
     *
     * The private isolated subnet has no route to the public internet and is therefore not able to download
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

    const publicInstance = new cdk.aws_ec2.Instance(this, "public", {
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
      },
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

    const privateWithEgressInstance = new cdk.aws_ec2.Instance(
      this,
      "privateEgress",
      {
        vpcSubnets: {
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        vpc: vpc,
        securityGroup: securityGroup,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO,
        ),
        machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
        userData: userData,
        instanceName: `privateEgress-${props.scope}`,
      },
    );

    /**
     * The private isolated subnet has no route to the public internet and is therefore not able to download
     * or install any external software. For this reason the EC2 instance in the isolated subnet will not
     * have a `UserData` resource object to attempt to download an httpd server installed on it, meaning that
     * all `curl` commands will fail, but `ping` will still continue to work from within the VPC.
     */
    const privateIsolatedInstance = new cdk.aws_ec2.Instance(
      this,
      "privateIsolated",
      {
        vpcSubnets: {
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
        },
        vpc: vpc,
        securityGroup: securityGroup,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO,
        ),
        machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
        instanceName: `privateIsolated-${props.scope}`,
      },
    );

    new cdk.CfnOutput(this, "publicInstancePublicIp", {
      description: "Public IP of the public instance",
      value: publicInstance.instancePublicIp,
      exportName: `publicEc2PublicIp-${props.scope}`,
    });

    new cdk.CfnOutput(this, "privateEgressInstancePublicIp", {
      description: "Public IP of the private with egress instance",
      value: privateWithEgressInstance.instancePublicIp,
      exportName: `privateEgressEc2PublicIp-${props.scope}`,
    });

    new cdk.CfnOutput(this, "privateEgressInstancePrivateIp", {
      description: "Private IP of the private with egress instance",
      value: privateWithEgressInstance.instancePrivateIp,
      exportName: `privateEgressEc2PrivateIp-${props.scope}`,
    });

    new cdk.CfnOutput(this, "privateIsolatedInstancePrivateIp", {
      description: "Private IP of the private isolated instance",
      value: privateIsolatedInstance.instancePrivateIp,
      exportName: `privateIsolatedEc2PrivateIp-${props.scope}`,
    });
  }
}
