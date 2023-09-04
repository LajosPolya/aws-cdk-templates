import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployBatchJobWithFargateStackProps extends cdk.StackProps {
  scope: string;
  ecrName: string;
}

export class DeployBatchJobWithFargateStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DeployBatchJobWithFargateStackProps,
  ) {
    super(scope, id, props);

    const ecr = cdk.aws_ecr.Repository.fromRepositoryName(
      this,
      "ecr",
      props.ecrName,
    );

    const vpc = new cdk.aws_ec2.Vpc(this, "vpc", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(
        cdk.aws_ec2.Vpc.DEFAULT_CIDR_RANGE,
      ),
      enableDnsHostnames: false,
      enableDnsSupport: true,
      availabilityZones: [`${props.env!.region!}a`, `${props.env!.region!}b`],
    });

    const batchecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "batchSecurityGroup",
      {
        securityGroupName: `batchSecurityGroup-${props.scope}`,
        description: "Batch Job Security Group",
        vpc,
        allowAllOutbound: true,
        allowAllIpv6Outbound: true,
      },
    );
    batchecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.tcp(80),
      "Allow all",
    );

    const computeEnv = new cdk.aws_batch.CfnComputeEnvironment(
      this,
      "computeEnv",
      {
        computeEnvironmentName: `batchJobWithFargate-${props.scope}`,
        type: "MANAGED",
        computeResources: {
          securityGroupIds: [batchecurityGroup.securityGroupId],
          maxvCpus: 1,
          subnets: vpc.privateSubnets.map((subnet) => subnet.subnetId),
          type: "FARGATE_SPOT",
        },
      },
    );

    const jobQueue = new cdk.aws_batch.CfnJobQueue(this, "jobQueue", {
      computeEnvironmentOrder: [
        {
          computeEnvironment: computeEnv.ref,
          order: 1,
        },
      ],
      jobQueueName: `jobQueue-${props.scope}`,
      priority: 1,
    });

    const executionRole = new cdk.aws_iam.Role(this, "jobExecutionRole", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      description: "Execution role for Batch Job ECS Task",
      inlinePolicies: {
        policyName: new cdk.aws_iam.PolicyDocument({
          statements: [
            new cdk.aws_iam.PolicyStatement({
              actions: [
                "ecr:GetAuthorizationToken",
                "ecr:BatchGetImage",
                "ecr:GetDownloadUrlForLayer",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              resources: ["*"],
            }),
          ],
        }),
      },
    });

    const jobDefinition = new cdk.aws_batch.CfnJobDefinition(
      this,
      "jobDefinition",
      {
        containerProperties: {
          image: ecr.repositoryUri,
          resourceRequirements: [
            {
              type: "VCPU",
              value: "0.25",
            },
            {
              type: "MEMORY",
              value: "512",
            },
          ],
          executionRoleArn: executionRole.roleArn,
        },
        jobDefinitionName: `jobDefinition-${props.scope}`,
        platformCapabilities: [`FARGATE`],
        retryStrategy: {
          attempts: 1,
        },
        type: "container",
      },
    );

    new cdk.CfnOutput(this, "jobQueueName", {
      description: "The name of the Job Queue",
      value: jobQueue.jobQueueName ?? "",
      exportName: `jobQueueName-${props.scope}`,
    });

    new cdk.CfnOutput(this, "jobDefinitionName", {
      description: "The Job definition",
      value: jobDefinition.jobDefinitionName ?? "",
      exportName: `jobDefinition-${props.scope}`,
    });
  }
}
