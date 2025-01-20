import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface DeployRdsStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployRdsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeployRdsStackProps) {
    super(scope, id, props);

    const vpc = new cdk.aws_ec2.Vpc(this, "vpc", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(
        cdk.aws_ec2.Vpc.DEFAULT_CIDR_RANGE,
      ),
      availabilityZones: [`${props.env!.region!}a`],
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 16,
          name: `rdsPublic-${props.scope}`,
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
      ],
    });

    new cdk.aws_rds.DatabaseCluster(this, "cluster", {
      engine: cdk.aws_rds.DatabaseClusterEngine.AURORA_MYSQL,
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
      }),
      // securityGroups:
      clusterIdentifier: `rds-${props.scope}`,
      defaultDatabaseName: props.scope ?? "defaultSchema",
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      
    })
  }
}
