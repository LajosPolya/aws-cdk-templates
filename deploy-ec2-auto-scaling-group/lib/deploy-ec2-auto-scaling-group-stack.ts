import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployEc2AutoscalingGroupStackProps extends cdk.StackProps {
  scope: string;
  deploySecondInstanceCron: string;
}

export class DeployEc2AutoscalingGroupStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployEc2AutoscalingGroupStackProps
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
          name: `ec2AutoScalingSubnetGroup-${props.scope}`,
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const securityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "securityGroup",
      {
        securityGroupName: `ec2AutoScalingSecurityGroup-${props.scope}`,
        description: "Allow all traffic",
        vpc: vpc,
        allowAllOutbound: true,
        allowAllIpv6Outbound: true,
      }
    );
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

    const launchTemplate = new cdk.aws_ec2.LaunchTemplate(
      this,
      "launch-template",
      {
        launchTemplateName: `ec2AutoScalingGroupLaunchTemplate-${props.scope}`,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO
        ),
        machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
        userData: userData,
        securityGroup: securityGroup,
      }
    );

    const autoScalingGroup = new cdk.aws_autoscaling.AutoScalingGroup(
      this,
      "autoScalingGroup",
      {
        vpc: vpc,
        launchTemplate: launchTemplate,
        minCapacity: 1,
        desiredCapacity: 1,
        maxCapacity: 2,
        vpcSubnets: {
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
        allowAllOutbound: true,
        autoScalingGroupName: `ec2AutoScalingGroup-${props.scope}`,
      }
    );
    // Schedule a second instance to run on a scedule
    autoScalingGroup.scaleOnSchedule("scaleOnSchedule", {
      schedule: cdk.aws_autoscaling.Schedule.expression(
        props.deploySecondInstanceCron
      ),
      desiredCapacity: 2,
    });
  }
}
