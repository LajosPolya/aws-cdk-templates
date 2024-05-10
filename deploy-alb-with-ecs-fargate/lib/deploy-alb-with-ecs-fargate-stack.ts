import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployAlbWithEcsFargateStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployAlbWithEcsFargateStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployAlbWithEcsFargateStackProps,
  ) {
    super(scope, id, props);

    const vpc = new cdk.aws_ec2.Vpc(this, "vpc", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(
        cdk.aws_ec2.Vpc.DEFAULT_CIDR_RANGE,
      ),
      availabilityZones: [`${props.env!.region!}a`, `${props.env!.region!}b`],
    });

    const cluster = new cdk.aws_ecs.Cluster(this, "cluster", {
      clusterName: `albWithEcsFargateCluster-${props.scope}`,
      vpc: vpc,
      enableFargateCapacityProviders: true,
    });

    const fargateTaskDef = new cdk.aws_ecs.FargateTaskDefinition(
      this,
      "fargateTaskDefinition",
      {
        cpu: 256,
        memoryLimitMiB: 512,
        family: `albWithEcsFamily-${props.scope}`,
      },
    );
    fargateTaskDef.addContainer("apiContainer", {
      image: cdk.aws_ecs.ContainerImage.fromAsset("../api"),
      essential: true,
      portMappings: [
        {
          containerPort: 8080,
        },
      ],
      logging: cdk.aws_ecs.LogDrivers.awsLogs({
        streamPrefix: `albWithEcsLogs-${props.scope}`,
        logGroup: new cdk.aws_logs.LogGroup(this, "logGroup", {
          logGroupName: `/alb-with-ecs/${props.scope}`,
          retention: cdk.aws_logs.RetentionDays.ONE_DAY,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
      }),
    });

    const albEcsFargate =
      new cdk.aws_ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "fargateService",
        {
          cluster: cluster,
          desiredCount: 2,
          taskDefinition: fargateTaskDef,
          publicLoadBalancer: true,
        },
      );

    const scalableTaskCount = albEcsFargate.service.autoScaleTaskCount({
      maxCapacity: 3,
    });

    scalableTaskCount.scaleOnCpuUtilization("scaleOnCpu", {
      targetUtilizationPercent: 80,
      policyName: `albWithEcs-${props.scope}`,
    });

    albEcsFargate.targetGroup.configureHealthCheck({
      enabled: true,
      path: "/health",
      healthyThresholdCount: 2,
      port: "8080",
      healthyHttpCodes: "204",
    });


    // TODO OUTPUT CLUSTER name to get tasks via command line aws ecs list-tasks --cluster <cluster_name>

    new cdk.CfnOutput(this, "albDnsName", {
      description: "The Application Load Balancer's public DNS name",
      value: albEcsFargate.loadBalancer.loadBalancerDnsName,
      exportName: `albDnsName-${props.scope}`,
    });
  }
}
