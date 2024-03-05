import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployAlbWithEc2AutoScalingGroupStackProps
  extends cdk.StackProps {
  scope: string;
  deploySecondInstanceCron: string;
}

export class DeployAlbWithEc2AutoScalingGroupStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployAlbWithEc2AutoScalingGroupStackProps,
  ) {
    super(scope, id, props);

    /* Deploy with default subnet configuration which deploys one public subnet and one private subnet.
    The default VPC also deploys one NAT Gateway in each AZ thus making the private subnet PRIVATE_WITH_EGRESS
    which is needed for private instances to communicate with the ALB. The VPC also doesn't need to enable DNS
    hostnames for instance since the instances don't need access to the public internet, only the ALB needs
    access to the public internet.
    */
    const vpc = new cdk.aws_ec2.Vpc(this, "vpc", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(
        cdk.aws_ec2.Vpc.DEFAULT_CIDR_RANGE,
      ),
      enableDnsHostnames: false,
      enableDnsSupport: true,
      availabilityZones: [`${props.env!.region!}a`, `${props.env!.region!}b`],
    });

    const albSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "albSecurityGroup",
      {
        securityGroupName: `albSecurityGroup-${props.scope}`,
        description: "ALB Security Group",
        vpc,
      },
    );
    albSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.allTcp(),
      "Allow all TCP",
    );

    const launchTemplateSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "securityGroup",
      {
        securityGroupName: `launchTemplateSecurityGroup-${props.scope}`,
        description: "Allow traffic from ALB",
        vpc,
      },
    );
    launchTemplateSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.securityGroupId(albSecurityGroup.securityGroupId),
      cdk.aws_ec2.Port.tcp(80),
      "Allow connection from the ALB",
    );

    const userData = cdk.aws_ec2.UserData.forLinux();
    // This list of commands was copied from Stephane Maarek's AWS Certified Associate DVA-C01 Udemy Course
    userData.addCommands(
      "#!/bin/bash",
      "yum update -y",
      "yum install -y httpd",
      "systemctl start httpd",
      "systemctl enable httpd",
      'echo "<h1>Hello world from $(hostname -f)</h1>" > /var/www/html/index.html',
    );

    const launchTemplate = new cdk.aws_ec2.LaunchTemplate(
      this,
      "launchTemplate",
      {
        launchTemplateName: `albAutoScalingGroupLaunchTemplate-${props.scope}`,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO,
        ),
        machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
        userData,
        securityGroup: launchTemplateSecurityGroup,
      },
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
        autoScalingGroupName: `albAutoScalingGroup-${props.scope}`,
      },
    );
    // Schedule a second instance to run on a scedule
    autoScalingGroup.scaleOnSchedule("scaleOnSchedule", {
      schedule: cdk.aws_autoscaling.Schedule.expression(
        props.deploySecondInstanceCron,
      ),
      desiredCapacity: 2,
    });

    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      this,
      "alb",
      {
        securityGroup: albSecurityGroup,
        loadBalancerName: `albAutoScaling-${props.scope}`,
        vpc,
        internetFacing: true,
        deletionProtection: false,
      },
    );
    const listener = alb.addListener("internetListener", {
      port: 80,
      open: true,
    });
    listener.addTargets("application", {
      protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
      port: 80,
      targets: [autoScalingGroup],
      targetGroupName: `albAutoScaling-${props.scope}`,
      healthCheck: {
        enabled: true,
        healthyThresholdCount: 2,
      },
    });

    new cdk.CfnOutput(this, "albDnsName", {
      description: "The Load Balancer's DNS name",
      value: alb.loadBalancerDnsName,
      exportName: `albDnsName-${props.scope}`,
    });
  }
}
