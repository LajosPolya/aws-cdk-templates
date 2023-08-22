import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployNlbWithEc2InstanceStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployNlbWithEc2InstanceStack extends cdk.Stack {
  private static port: number = 80;

  constructor(
    scope: Construct,
    id: string,
    props: DeployNlbWithEc2InstanceStackProps
  ) {
    super(scope, id, props);

    /* Deploy with default subnet configuration which deploys ones public subnet and one private subnet.
    The default VPC also deploys one NAT Gateway in each AZ thus making the private subnet PRIVATE_WITH_EGRESS
    which is needed for private instances to communicate with the NLB. The VPC also doesn't need to enable DNS
    hostnames for instance since the instances don't need access to the public internet, only the NLB needs
    access to the public internet.
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

    const securityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "asgSecurityGroup",
      {
        securityGroupName: `asgNlbEc2InstanceSecurityGroup-${props.scope}`,
        description: "Allow all traffic",
        vpc: vpc,
      }
    );
    // Allow connection from the NLB
    securityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.tcp(DeployNlbWithEc2InstanceStack.port)
    );
    const ec2Instance1 = new cdk.aws_ec2.Instance(this, "ec2Instance1", {
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      allowAllOutbound: true,
      vpc: vpc,
      securityGroup: securityGroup,
      instanceType: cdk.aws_ec2.InstanceType.of(
        cdk.aws_ec2.InstanceClass.T2,
        cdk.aws_ec2.InstanceSize.MICRO
      ),
      machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
      userData: userData,
      // role: Does this need a role
      instanceName: `ec2Instance1-${props.scope}`,
    });

    const ec2Instance2 = new cdk.aws_ec2.Instance(this, "ec2Instance2", {
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      allowAllOutbound: true,
      vpc: vpc,
      securityGroup: securityGroup,
      instanceType: cdk.aws_ec2.InstanceType.of(
        cdk.aws_ec2.InstanceClass.T2,
        cdk.aws_ec2.InstanceSize.MICRO
      ),
      machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
      userData: userData,
      // role: Does this need a role
      instanceName: `ec2Instance2-${props.scope}`,
    });

    const nlb = new cdk.aws_elasticloadbalancingv2.NetworkLoadBalancer(
      this,
      "nlb",
      {
        crossZoneEnabled: true,
        loadBalancerName: `nlbEc2Instance-${props.scope}`,
        vpc: vpc,
        internetFacing: true,
        deletionProtection: false,
      }
    );
    const listener = nlb.addListener("internetListener", {
      port: DeployNlbWithEc2InstanceStack.port,
      protocol: cdk.aws_elasticloadbalancingv2.Protocol.TCP,
    });
    const instance1Target =
      new cdk.aws_elasticloadbalancingv2_targets.InstanceTarget(ec2Instance1);
    const instance2Target =
      new cdk.aws_elasticloadbalancingv2_targets.InstanceTarget(ec2Instance2);
    listener.addTargets("application", {
      protocol: cdk.aws_elasticloadbalancingv2.Protocol.TCP,
      port: DeployNlbWithEc2InstanceStack.port,
      targets: [instance1Target, instance2Target],
      targetGroupName: `nlbTargetGroup-${props.scope}`,
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
