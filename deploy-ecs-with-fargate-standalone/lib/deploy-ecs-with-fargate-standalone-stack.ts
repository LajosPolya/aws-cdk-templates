import * as cdk from 'aws-cdk-lib';
import { TaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

export interface DeployEcsWithFargateStandaloneStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployEcsWithFargateStandaloneStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeployEcsWithFargateStandaloneStackProps) {
    super(scope, id, props);

    const vpc = new cdk.aws_ec2.Vpc(this, "vpc", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(
        cdk.aws_ec2.Vpc.DEFAULT_CIDR_RANGE,
      ),
      availabilityZones: [`${props.env!.region!}a`],
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 28,
          name: `ecsFargatePrivate-${props.scope}`,
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          /*
            The ECS standalone task will be run in the Private Subnet
            but a Public Subnet is needed in order for the Private Subnet
            to route traffic through a NAT Gateway to download the image
            from ECR. 
          */
          cidrMask: 28,
          name: `ecsFargatePublic-${props.scope}`,
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const cluster = new cdk.aws_ecs.Cluster(this, "cluster", {
      clusterName: `ecsFargateStandalone-${props.scope}`,
      vpc: vpc,
      enableFargateCapacityProviders: true,
    });

    const fargateTaskDef = new cdk.aws_ecs.FargateTaskDefinition(
      this,
      "fargateTaskDefinition",
      {
        cpu: 256,
        memoryLimitMiB: 512,
        family: `ecsFargateStandalone-${props.scope}`,
      },
    );
    fargateTaskDef.addContainer("apiContainer", {
      image: cdk.aws_ecs.ContainerImage.fromAsset("../batch-job-script"),
      essential: true,
      portMappings: [
        {
          containerPort: 8080,
        },
      ],
      logging: cdk.aws_ecs.LogDrivers.awsLogs({
        streamPrefix: `ecsFargate-${props.scope}`,
        logGroup: new cdk.aws_logs.LogGroup(this, "logGroup", {
          logGroupName: `/ecs-with-fargate-standalone/${props.scope}`,
          retention: cdk.aws_logs.RetentionDays.ONE_DAY,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
      }),
    });

    const securityGroup = new cdk.aws_ec2.SecurityGroup(this, "securityGroup", {
      securityGroupName: `ecsFargate-${props.scope}`,
      description: "Allow all traffic",
      vpc: vpc,
    });
    securityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.allTcp(),
      "Allow all TCP",
    );

    new cdk.CfnOutput(this, "taskDefinitionFamily", {
      description: "The Family Name of the Task Definition",
      value: fargateTaskDef.family,
      exportName: `taskDefinitionName-${props.scope}`,
    });

    new cdk.CfnOutput(this, "clusterName", {
      description: "The name of the Fargate Cluster",
      value: cluster.clusterName,
      exportName: `fargateClusterName-${props.scope}`,
    });

    new cdk.CfnOutput(this, "securityGroupId", {
      description: "The ID of the Security Group",
      value: securityGroup.securityGroupId,
      exportName: `securityGroupId-${props.scope}`,
    });

    new cdk.CfnOutput(this, "taskSubnetId", {
      description: "The ID of the Subnet",
      // There should only be one Private Subnet
      value: vpc.privateSubnets[0].subnetId,
      exportName: `subnetId-${props.scope}`,
    });

    // Output task definition, public subnet id, sg id, etc
    // aws ecs run-task --task-definition ecsFargateStandalone-lajos --cluster ecsFargateStandalone-lajos --network-configuration "awsvpcConfiguration={subnets=['subnet-0c43e5a96c0b23487'],securityGroups=['sg-0ef6ca47b54664365']}" --launch-type FARGATE
  }
}
