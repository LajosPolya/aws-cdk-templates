import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployAlbWithLambdaStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployAlbWithLambdaStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployAlbWithLambdaStackProps,
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

    const albSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "albSecurityGroup",
      {
        securityGroupName: `albSecurityGroup-${props.scope}`,
        description: "Allow all traffic",
        vpc,
      },
    );

    const lambdaSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "securityGroup",
      {
        securityGroupName: `lambdaSecurityGroup-${props.scope}`,
        description: "Allow traffic from ALB",
        vpc,
      },
    );
    lambdaSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.securityGroupId(albSecurityGroup.securityGroupId),
      cdk.aws_ec2.Port.tcp(80),
      "Allow connection from the ALB",
    );

    const inlineCode = cdk.aws_lambda.Code.fromInline(`
exports.handler = async(event) => {
  console.log(JSON.stringify(event));
  return {
    "isBase64Encoded": false,
    "statusCode": 200,
    "statusDescription": "200 OK",
    "headers": {
        "Content-Type": "application/json"
    },
    "body": "Lambda Successfully executed. Check logs for additional info."
  };
};    
    `);

    const lambda = new cdk.aws_lambda.Function(this, "inlineCodeLambda", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      code: inlineCode,
      handler: "index.handler",
      description: "Lambda deployed with inline code and triggered by an ALB",
      timeout: cdk.Duration.seconds(3),
      functionName: `lambdaTriggeredByAlb-${props.scope}`,
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
      retryAttempts: 0,
      securityGroups: [lambdaSecurityGroup],
      vpc: vpc,
    });

    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      this,
      "alb",
      {
        securityGroup: albSecurityGroup,
        loadBalancerName: `albForLambda-${props.scope}`,
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
