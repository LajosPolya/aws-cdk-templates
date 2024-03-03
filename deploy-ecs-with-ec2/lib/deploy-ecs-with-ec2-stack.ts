import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployEc2WithFargateStackProps extends cdk.StackProps {
  ecrName: string;
  imageTag: string;
  scope: string;
}

export class DeployEcsWithEc2Stack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployEc2WithFargateStackProps
  ) {
    super(scope, id, props);

    const ecr = cdk.aws_ecr.Repository.fromRepositoryArn(
      this,
      "ecr",
      `arn:aws:ecr:${props.env!.region!}:${props.env!.account!}:repository/${
        props.ecrName
      }`
    );

    const vpc = new cdk.aws_ec2.Vpc(this, "vpc", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(
        cdk.aws_ec2.Vpc.DEFAULT_CIDR_RANGE
      ),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      defaultInstanceTenancy: cdk.aws_ec2.DefaultInstanceTenancy.DEFAULT,
      availabilityZones: [`${props.env!.region!}a`],
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 16,
          name: `ecsWithEc2SubnetGroup-${props.scope}`,
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const cluster = new cdk.aws_ecs.Cluster(this, "cluster", {
      clusterName: `ecsWithEc2Cluster-${props.scope}`,
      vpc: vpc,
      capacity: {
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MICRO
        ),
      },
    });

    const ec2TaskDef = new cdk.aws_ecs.Ec2TaskDefinition(
      this,
      "ec2TaskDefinition",
      {
        networkMode: cdk.aws_ecs.NetworkMode.HOST,
        family: `ecsWithEc2Family-${props.scope}`,
      }
    );
    ec2TaskDef.addContainer("apiContainer", {
      image: cdk.aws_ecs.ContainerImage.fromEcrRepository(ecr, props.imageTag),
      containerName: `container-${props.scope}`,
      disableNetworking: false,
      startTimeout: cdk.Duration.minutes(2),
      essential: true,
      memoryLimitMiB: 512,
      logging: cdk.aws_ecs.LogDrivers.awsLogs({
        streamPrefix: `ecsWithEc2ApiLogs-${props.scope}`,
        logGroup: new cdk.aws_logs.LogGroup(this, "logGroup", {
          logGroupName: `/ecs-with-ec2-api/${props.scope}`,
          retention: cdk.aws_logs.RetentionDays.ONE_DAY,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
      }),
      portMappings: [
        {
          containerPort: 8080,
        },
      ],
    });

    const ec2Service = new cdk.aws_ecs.Ec2Service(this, "ec2Service", {
      taskDefinition: ec2TaskDef,
      cluster: cluster,
      desiredCount: 1,
      serviceName: `ec2Service-${props.scope}`,
    });
    ec2Service.connections.allowFromAnyIpv4(cdk.aws_ec2.Port.allTcp());

    new cdk.CfnOutput(this, "clusterArn", {
      description: "The ARN of the Fargate Cluster",
      value: cluster.clusterArn,
      exportName: `ecsClusterArn-${props.scope}`,
    });
  }
}
