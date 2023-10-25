import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployNlbWithEc2AutoScalingGroupStackProps
  extends cdk.StackProps {
  scope: string;
  deploySecondInstanceCron: string;
}

export class DeployNlbWithEc2AutoScalingGroupStack extends cdk.Stack {
  private static port: number = 80;

  constructor(
    scope: Construct,
    id: string,
    props: DeployNlbWithEc2AutoScalingGroupStackProps
  ) {
    super(scope, id, props);

    /* Deploy with default subnet configuration which deploys one public subnet and one private subnet.
    The default VPC also deploys one NAT Gateway in each AZ thus making the private subnet PRIVATE_WITH_EGRESS
    which is needed for private instances to communicate with the NLB. The VPC also doesn't need to enable DNS
    hostnames for instance since the instances don't need access to the public internet.
    */
    const vpc = new cdk.aws_ec2.Vpc(this, "vpc", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(
        cdk.aws_ec2.Vpc.DEFAULT_CIDR_RANGE
      ),
      enableDnsHostnames: false,
      enableDnsSupport: true,
      availabilityZones: [`${props.env!.region!}a`, `${props.env!.region!}b`],
    });

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

    const launchTemplateSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "asgSecurityGroup",
      {
        securityGroupName: `asgNlbAutoScalingSecurityGroup-${props.scope}`,
        description: "Allow all traffic",
        vpc: vpc,
      }
    );
    // Allow connection from the NLB
    launchTemplateSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.tcp(DeployNlbWithEc2AutoScalingGroupStack.port)
    );
    const launchTemplate = new cdk.aws_ec2.LaunchTemplate(
      this,
      "launchTemplate",
      {
        launchTemplateName: `nlbAutoScalingGroupLaunchTemplate-${props.scope}`,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO
        ),
        machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
        userData: userData,
        securityGroup: launchTemplateSecurityGroup,
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
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        allowAllOutbound: true,
        autoScalingGroupName: `nlbAutoScalingGroup-${props.scope}`,
      }
    );
    // Schedule a second instance to run on a scedule
    autoScalingGroup.scaleOnSchedule("scaleOnSchedule", {
      schedule: cdk.aws_autoscaling.Schedule.expression(
        props.deploySecondInstanceCron
      ),
      desiredCapacity: 2,
    });

    const nlb = new cdk.aws_elasticloadbalancingv2.NetworkLoadBalancer(
      this,
      "nlb",
      {
        crossZoneEnabled: true,
        loadBalancerName: `nlbAutoScaling-${props.scope}`,
        vpc: vpc,
        internetFacing: true,
        deletionProtection: false,
      }
    );
    const listener = nlb.addListener("internetListener", {
      port: DeployNlbWithEc2AutoScalingGroupStack.port,
      protocol: cdk.aws_elasticloadbalancingv2.Protocol.TCP,
    });
    listener.addTargets("application", {
      protocol: cdk.aws_elasticloadbalancingv2.Protocol.TCP,
      port: DeployNlbWithEc2AutoScalingGroupStack.port,
      targets: [autoScalingGroup],
      targetGroupName: `nlbAutoScaling-${props.scope}`,
      healthCheck: {
        enabled: true,
        healthyThresholdCount: 2,
      },
    });

    new cdk.CfnOutput(this, "nlbDnsName", {
      description: "The DNS name of the NLB",
      value: nlb.loadBalancerDnsName,
      exportName: `nlbDnsName-${props.scope}`,
    });
  }
}
