import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class DeployVpcWithFargateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new cdk.aws_ec2.Vpc(this, 'vpc', {
        ipAddresses: cdk.aws_ec2.IpAddresses.cidr(cdk.aws_ec2.Vpc.DEFAULT_CIDR_RANGE),
        enableDnsHostnames: true,
        enableDnsSupport: true,
        defaultInstanceTenancy: cdk.aws_ec2.DefaultInstanceTenancy.DEFAULT,
        availabilityZones: ['us-east-2a'],
        natGateways: 0,
        subnetConfiguration: [
          {
            cidrMask: 16,
            name: 'application',
            subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
          }
        ]
    });
  }
}
