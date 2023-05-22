import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployAlbWithEc2StackProps extends cdk.StackProps {
  scope: string;
  deploySecondInstanceCron: string;
}

export class DeployAlbWithEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeployAlbWithEc2StackProps) {
    super(scope, id, props);

    // Deploy with default subnet configuration which deploys ones public subnet and
    // one pribate subnet
    const vpc = new cdk.aws_ec2.Vpc(this, "vpc", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(
        cdk.aws_ec2.Vpc.DEFAULT_CIDR_RANGE
      ),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      // TODO: This is the default so remove from all instances of VPC
      defaultInstanceTenancy: cdk.aws_ec2.DefaultInstanceTenancy.DEFAULT,
      availabilityZones: [`${props.env!.region!}a`, `${props.env!.region!}b`],
      // natGateways: 0,
      /*subnetConfiguration: [
        {
          cidrMask: 16,
          name: `alb-with-ec2-subnet-group-${props.scope}`,
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
      ],*/
    });

    const securityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "security-group",
      {
        securityGroupName: `alb-with-ec2-security-group-${props.scope}`,
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

    // TODO: Do we need a SG for the ASG or is one automatically created when attaching the
    // target to the ALB?
    const asgSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "asg-security-group",
      {
        securityGroupName: `asg-alb-with-ec2-security-group-${props.scope}`,
        description: "Allow all traffic",
        vpc: vpc,
      }
    );

    const launchTemplate = new cdk.aws_ec2.LaunchTemplate(
      this,
      "launch-template",
      {
        launchTemplateName: `alb-with-ec2-launch-template-${props.scope}`,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO
        ),
        machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
        userData: userData,
        securityGroup: asgSecurityGroup,
      }
    );

    const autoScalingGroup = new cdk.aws_autoscaling.AutoScalingGroup(
      this,
      "auto-scaling-group",
      {
        vpc: vpc,
        launchTemplate: launchTemplate,
        minCapacity: 1,
        desiredCapacity: 1,
        maxCapacity: 2,
        vpcSubnets: {
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        allowAllOutbound: true,
        autoScalingGroupName: `alb-with-ec2-auto-scaling-group-${props.scope}`,
      }
    );
    // Schedule a second instance to run on a scedule
    autoScalingGroup.scaleOnSchedule("scale-on-schedule", {
      schedule: cdk.aws_autoscaling.Schedule.expression(
        props.deploySecondInstanceCron
      ),
      desiredCapacity: 2,
    });

    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      this,
      "alb",
      {
        securityGroup: securityGroup,
        loadBalancerName: `alb-with-ec2-${props.scope}`,
        vpc: vpc,
        internetFacing: true,
        // vpcSubnets:
        deletionProtection: false,
      }
    );
    const listener = alb.addListener("internet-listener", {
      port: 80,
      open: true,
    });
    listener.addTargets("application", {
      protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
      port: 80,
      targets: [autoScalingGroup],
      targetGroupName: `alb-with-ec2-target-${props.scope}`,
      healthCheck: {
        enabled: true,
        healthyThresholdCount: 2,
      },
    });
  }

  // TODO: this is a bug
  // https://github.com/aws/aws-cdk/issues/21690
  customAvailabilityZones = ["us-east-2a", "us-east-2b"];
  get availabilityZones() {
    return this.customAvailabilityZones;
  }
}
