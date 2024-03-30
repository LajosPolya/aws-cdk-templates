import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployPrivateLambdaStackProps extends cdk.StackProps {
  scope: string;
  vpcL1: cdk.aws_ec2.CfnVPC;
  privateSubnet: cdk.aws_ec2.CfnSubnet;
}

export class DeployPrivateLambdaStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployPrivateLambdaStackProps,
  ) {
    super(scope, id, props);

    const tag = props.vpcL1.tags.tagValues();
    const tags: {
      [key: string]: string;
    } = {};
    // tags aren't unique so deploying and then deleting deployment
    // may return wrong VPC
    tags["test"] = "testTag";
    tags["45"] = "45";
    tags[props.scope] = props.scope;
    const vpc = cdk.aws_ec2.Vpc.fromLookup(this, "vpcL2", {
      tags: tags,
    });

    const securityGroup = new cdk.aws_ec2.SecurityGroup(this, "securityGroup", {
      securityGroupName: `ec2InstanceSecurityGroup1-${props.scope}`,
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

    const privateSubnet = cdk.aws_ec2.Subnet.fromSubnetAttributes(
      this,
      "privateSubnet",
      {
        availabilityZone: props.privateSubnet.attrAvailabilityZone,
        subnetId: props.privateSubnet.attrSubnetId,
      },
    );

    const instance = new cdk.aws_ec2.Instance(this, "ec2-istance", {
      vpcSubnets: {
        subnets: [privateSubnet],
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
      instanceName: `privateEc2Instance-${props.scope}`,
    });

    /*new cdk.CfnOutput(this, "publicIp", {
      description: "Public IP of the EC2 instance",
      value: instance.instancePublicIp,
      exportName: `ec2InstancePublicIp1-${props.scope}`,
    });

    new cdk.CfnOutput(this, "publicDnsName", {
      description: "Public DNS name of the EC2 instance",
      value: instance.instancePublicDnsName,
      exportName: `ec2InstancePublicDnsName1-${props.scope}`,
    });*/
  }
}
