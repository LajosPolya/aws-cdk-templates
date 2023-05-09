import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployEcsWithFargateStackProps extends cdk.StackProps {
  ecrName: string;
  scope: string;
}

export class DeployEcsWithFargateStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployEcsWithFargateStackProps
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
      clusterName: `ecs-with-fargate-cluster-${props.scope}`,
      vpc: vpc,
      enableFargateCapacityProviders: true,
    });

    const fargateTaskDef = new cdk.aws_ecs.FargateTaskDefinition(
      this,
      "fargate-task-definition",
      {
        cpu: 256,
        memoryLimitMiB: 512,
        family: `ecs-with-fargate-family-${props.scope}`,
      }
    );
    fargateTaskDef.addContainer("api-container", {
      image: cdk.aws_ecs.ContainerImage.fromEcrRepository(ecr, "latest"),
      essential: true,
      portMappings: [
        {
          containerPort: 8080,
        },
      ],
      logging: cdk.aws_ecs.LogDrivers.awsLogs({
        streamPrefix: `ecs-with-fargate-api-logs-${props.scope}`,
        logGroup: new cdk.aws_logs.LogGroup(this, "log-group", {
          logGroupName: `/ecs-with-fargate-api/${props.scope}`,
          retention: cdk.aws_logs.RetentionDays.ONE_DAY,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
      }),
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
    securityGroup.addIngressRule(cdk.aws_ec2.Peer.anyIpv4(), cdk.aws_ec2.Port.allTcp(), 'Allow all TCP');
    new cdk.aws_ecs.FargateService(
      this,
      "fargate-service",
      {
        taskDefinition: fargateTaskDef,
        assignPublicIp: true,
        vpcSubnets: vpc.selectSubnets({
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        }),
        cluster: cluster,
        desiredCount: 1,
        serviceName: `fargate-service-${props.scope}`,
        platformVersion: cdk.aws_ecs.FargatePlatformVersion.VERSION1_4,
        securityGroups: [securityGroup],
      }
    );
  }

  // TODO: this is a bug
  // https://github.com/aws/aws-cdk/issues/21690
  customAvailabilityZones = ["us-east-2a"];
  get availabilityZones() {
    return this.customAvailabilityZones;
  }
}
