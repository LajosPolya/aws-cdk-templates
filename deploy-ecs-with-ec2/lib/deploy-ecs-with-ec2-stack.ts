import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployEc2WithFargateStackProps extends cdk.StackProps {
  ecrName: string;
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
          name: `subnet-group-${props.scope}`,
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const cluster = new cdk.aws_ecs.Cluster(this, "cluster", {
      clusterName: `ecs-with-ec2-cluster-${props.scope}`,
      vpc: vpc,
      capacity: {
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T2,
          cdk.aws_ec2.InstanceSize.MEDIUM
        ),
      },
    });

    const ec2TaskDef = new cdk.aws_ecs.Ec2TaskDefinition(
      this,
      "ec2-task-definition",
      {
        networkMode: cdk.aws_ecs.NetworkMode.HOST,
        family: `ecs-with-ec2-family-${props.scope}`,
      }
    );
    ec2TaskDef.addContainer("api-container", {
      image: cdk.aws_ecs.ContainerImage.fromEcrRepository(ecr, "latest"),
      containerName: `container-${props.scope}`,
      disableNetworking: false,
      startTimeout: cdk.Duration.minutes(2),
      essential: true,
      memoryLimitMiB: 512,
      logging: cdk.aws_ecs.LogDrivers.awsLogs({
        streamPrefix: `ecs-with-ec2-api-logs-${props.scope}`,
        logGroup: new cdk.aws_logs.LogGroup(this, "log-group", {
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

    const securityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "security-group",
      {
        securityGroupName: `security-group-${props.scope}`,
        description: "Allow all traffic",
        vpc: vpc,
        allowAllOutbound: true,
        allowAllIpv6Outbound: true,
      }
    );

    const ec2Service = new cdk.aws_ecs.Ec2Service(this, "ec2-service", {
      taskDefinition: ec2TaskDef,
      cluster: cluster,
      desiredCount: 1,
      serviceName: `ec2-service-${props.scope}`,
    });
    ec2Service.connections.allowFromAnyIpv4(cdk.aws_ec2.Port.allTcp());
  }

  // TODO: this is a bug
  // https://github.com/aws/aws-cdk/issues/21690
  customAvailabilityZones = ["us-east-2a"];
  get availabilityZones() {
    return this.customAvailabilityZones;
  }
}
