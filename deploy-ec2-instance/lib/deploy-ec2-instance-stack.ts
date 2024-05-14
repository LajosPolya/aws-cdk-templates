import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployEc2InstanceStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployEc2InstanceStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployEc2InstanceStackProps
  ) {
    super(scope, id, props);

    const vpc = new cdk.aws_ec2.Vpc(this, "vpc", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(
        cdk.aws_ec2.Vpc.DEFAULT_CIDR_RANGE
      ),
      availabilityZones: [`${props.env!.region!}a`],
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 16,
          name: `ec2InstanceSubnetGroup-${props.scope}`,
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
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
      cdk.aws_ec2.Port.allTcp(),
      "Allow all TCP"
    );

    const userData = cdk.aws_ec2.UserData.forLinux();
    // This list of commands was copied from Stephane Maarek's AWS Certified Associate DVA-C01 Udemy Course
    userData.addCommands(
      "#!/bin/bash",
      "yum update -y",
      "yum install -y httpd",
      "systemctl start httpd",
      "systemctl enable httpd",
      'echo "<h1>Hello world from $(hostname -f)</h1>" > /var/www/html/index.html'
    );

    const instance = new cdk.aws_ec2.Instance(this, "ec2-istance", {
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
      },
      vpc: vpc,
      securityGroup: securityGroup,
      instanceType: cdk.aws_ec2.InstanceType.of(
        cdk.aws_ec2.InstanceClass.T2,
        cdk.aws_ec2.InstanceSize.MICRO
      ),
      machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
      userData: userData,
      instanceName: `ec2Instance-${props.scope}`,
    });

    new cdk.CfnOutput(this, "publicIp", {
      description: "Public IP of the EC2 instance",
      value: instance.instancePublicIp,
      exportName: `ec2InstancePublicIp-${props.scope}`,
    });

    new cdk.CfnOutput(this, "publicDnsName", {
      description: "Public DNS name of the EC2 instance",
      value: instance.instancePublicDnsName,
      exportName: `ec2InstancePublicDnsName-${props.scope}`,
    });
  }
}
