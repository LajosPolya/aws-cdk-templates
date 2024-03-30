import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployEc2StackProps extends cdk.StackProps {
  scope: string;
  vpcL1: cdk.aws_ec2.CfnVPC;
  publicSubnet: cdk.aws_ec2.CfnSubnet;
}

export class DeployEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeployEc2StackProps) {
    super(scope, id, props);

    const tag = props.vpcL1.tags.tagValues();
    const tags: {
      [key: string]: string;
    } = {};

    // Using tags because of https://github.com/aws/aws-cdk/issues/14809
    // tags aren't unique so deploying and then deleting deployment
    // may return wrong VPC
    tags["test"] = "testTag";
    tags["45"] = "45";
    tags[props.scope] = props.scope;
    const vpc = cdk.aws_ec2.Vpc.fromLookup(this, "vpcL2", {
      tags: tags,
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
    // This list of commands was copied from Stephane Maarek's AWS Certified Associate DVA-C01 Udemy Course
    // "sed -i -e \"s/Listen 80/Listen 8080/g\" /etc/httpd/conf/httpd.conf",
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

    const instance = new cdk.aws_ec2.Instance(this, "ec2-istance", {
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
      instanceName: `ec2Instance-${props.scope}`,
    });

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
