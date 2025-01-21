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

    const vpc = new cdk.aws_ec2.Vpc(this, "vpc", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(
        cdk.aws_ec2.Vpc.DEFAULT_CIDR_RANGE,
      ),
      enableDnsHostnames: false,
      enableDnsSupport: true,
      availabilityZones: [`${props.env!.region!}a`, `${props.env!.region!}b`],
    });

    // The lambda handler must be compiled, otherwise this will throw an error
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
        securityGroupName: `alb-${props.scope}`,
        description: "Allow all traffic",
        vpc: vpc,
      },
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

    new cdk.CfnOutput(this, "logGroupName", {
      description: "The name of the Lambda's Log Group",
      value: lambda.logGroup.logGroupName,
      exportName: `logGroupName-${props.scope}`,
    });
  }
}
