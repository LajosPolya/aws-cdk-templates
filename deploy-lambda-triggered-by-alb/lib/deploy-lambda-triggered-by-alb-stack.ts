import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployLambdaTriggeredByAlbStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployLambdaTriggeredByAlbStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployLambdaTriggeredByAlbStackProps,
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

    // The lambda handler must be compiled, otherwise this will error out
    const asset = cdk.aws_lambda.Code.fromAsset(
      "../lambda-handler-with-alb-event/dist/index.zip",
    );

    const lambda = new cdk.aws_lambda.Function(this, "lambdaTriggeredByAlb", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      code: asset,
      handler: "index.handler",
      description: "Lambda triggered by ALB",
      timeout: cdk.Duration.seconds(3),
      functionName: `lambdaTriggeredByAlb-${props.scope}`,
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
      retryAttempts: 0,
    });

    const albSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "albSecurityGroup",
      {
        securityGroupName: `albSecurityGroup-${props.scope}`,
        description: "Allow all traffic",
        vpc,
        allowAllOutbound: true,
        allowAllIpv6Outbound: true,
      },
    );
    albSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.allTcp(),
      "Allow all TCP",
    );

    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      this,
      "alb",
      {
        securityGroup: albSecurityGroup,
        loadBalancerName: `albEc2Instance-${props.scope}`,
        vpc: vpc,
        internetFacing: true,
        deletionProtection: false,
      },
    );
    const listener = alb.addListener("internetListener", {
      protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
      open: true,
    });

    const target = new cdk.aws_elasticloadbalancingv2_targets.LambdaTarget(
      lambda,
    );

    listener.addTargets("target", {
      targets: [target],
      targetGroupName: `albLambda-${props.scope}`,
      healthCheck: {
        enabled: true,
        healthyThresholdCount: 2,
      },
    });

    new cdk.CfnOutput(this, "albDnsName", {
      description: "The DNS name of the ALB",
      value: alb.loadBalancerDnsName,
      exportName: `albDnsName-${props.scope}`,
    });
  }
}
