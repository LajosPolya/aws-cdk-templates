import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployAlbWithEcsFargateFromEcrStackProps extends cdk.StackProps {
  repo: cdk.aws_ecr.IRepository;
  imageTag: string;
  scope: string;
}

export class DeployAlbWithEcsFargateFromEcrStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployAlbWithEcsFargateFromEcrStackProps,
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
      image: cdk.aws_ecs.ContainerImage.fromEcrRepository(
        props.repo,
        props.imageTag
      ),
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

    albEcsFargate.targetGroup.configureHealthCheck({
      enabled: true,
      path: "/health",
      healthyThresholdCount: 2,
      port: "8080",
      healthyHttpCodes: "204",
    });

    new cdk.CfnOutput(this, "albDnsName", {
      description: "The Application Load Balancer's public DNS name",
      value: albEcsFargate.loadBalancer.loadBalancerDnsName,
      exportName: `albDnsName-${props.scope}`,
    });
  }
}
