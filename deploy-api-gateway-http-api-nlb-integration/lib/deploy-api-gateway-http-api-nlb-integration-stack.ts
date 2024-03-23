import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployApiGatewayHttpApiNlbIntegrationStackProps
  extends cdk.StackProps {
  scope: string;
}

export class DeployApiGatewayHttpApiNlbIntegrationStack extends cdk.Stack {
  private static port: number = 80;

  constructor(
    scope: Construct,
    id: string,
    props: DeployApiGatewayHttpApiNlbIntegrationStackProps,
  ) {
    super(scope, id, props);

    /* Deploy with default subnet configuration which deploys one public subnet and one private subnet.
    The default VPC also deploys one NAT Gateway in each AZ thus making the private subnet PRIVATE_WITH_EGRESS
    which is needed for private instances to communicate with the NLB. The VPC also doesn't need to enable DNS
    hostnames for instance since the instances don't need access to the public internet.
    */
    const vpc = new cdk.aws_ec2.Vpc(this, "vpc", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(
        cdk.aws_ec2.Vpc.DEFAULT_CIDR_RANGE,
      ),
      enableDnsHostnames: false,
      enableDnsSupport: true,
      availabilityZones: [`${props.env!.region!}a`, `${props.env!.region!}b`],
    });

    const userData = cdk.aws_ec2.UserData.forLinux();
    // This list of commands was copied from Stephane Maarek's AWS Certified Associate DVA-C01 Udemy Course
    userData.addCommands(
      "#!/bin/bash",
      "yum update -y",
      "yum install -y httpd",
      "systemctl start httpd",
      "systemctl enable httpd",
      'echo "<h1>Hello world from $(hostname -f)</h1>" > /var/www/html/index.html',
    );

    const vpcLinkSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "vpcLinkSecurityGroup",
      {
        securityGroupName: `vpcLinkSecurityGroup-${props.scope}`,
        description: "Allow all traffic",
        vpc,
      },
    );
    vpcLinkSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.allTcp(),
      "Allow all TCP",
    );

    const instanceSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "instanceSecurityGroup",
      {
        securityGroupName: `nlbEc2InstanceSecurityGroup-${props.scope}`,
        description: "Allow all traffic",
        vpc: vpc,
      },
    );
    // Allow connection from the VPC Link
    instanceSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.tcp(DeployApiGatewayHttpApiNlbIntegrationStack.port),
    );
    const ec2Instance1 = new cdk.aws_ec2.Instance(this, "ec2Instance1", {
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      allowAllOutbound: true,
      vpc: vpc,
      securityGroup: instanceSecurityGroup,
      instanceType: cdk.aws_ec2.InstanceType.of(
        cdk.aws_ec2.InstanceClass.T2,
        cdk.aws_ec2.InstanceSize.MICRO,
      ),
      machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
      userData: userData,
      instanceName: `ec2Instance1-${props.scope}`,
    });

    const ec2Instance2 = new cdk.aws_ec2.Instance(this, "ec2Instance2", {
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      allowAllOutbound: true,
      vpc: vpc,
      securityGroup: instanceSecurityGroup,
      instanceType: cdk.aws_ec2.InstanceType.of(
        cdk.aws_ec2.InstanceClass.T2,
        cdk.aws_ec2.InstanceSize.MICRO,
      ),
      machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023(),
      userData: userData,
      instanceName: `ec2Instance2-${props.scope}`,
    });

    const nlb = new cdk.aws_elasticloadbalancingv2.NetworkLoadBalancer(
      this,
      "nlb",
      {
        crossZoneEnabled: true,
        loadBalancerName: `nlbEc2Instance-${props.scope}`,
        vpc: vpc,
        // Doesn't need to be internet routable since the VPC Link routes it
        // to the API Gateway's VPC
        internetFacing: false,
        deletionProtection: false,
      },
    );
    const listener = nlb.addListener("internetListener", {
      port: DeployApiGatewayHttpApiNlbIntegrationStack.port,
      protocol: cdk.aws_elasticloadbalancingv2.Protocol.TCP,
    });
    const instance1Target =
      new cdk.aws_elasticloadbalancingv2_targets.InstanceTarget(ec2Instance1);
    const instance2Target =
      new cdk.aws_elasticloadbalancingv2_targets.InstanceTarget(ec2Instance2);
    listener.addTargets("application", {
      protocol: cdk.aws_elasticloadbalancingv2.Protocol.TCP,
      port: DeployApiGatewayHttpApiNlbIntegrationStack.port,
      targets: [instance1Target, instance2Target],
      targetGroupName: `nlbTargetGroup-${props.scope}`,
      healthCheck: {
        enabled: true,
        healthyThresholdCount: 2,
      },
    });

    const vpcLink = new cdk.aws_apigatewayv2.VpcLink(this, "vpcLink", {
      vpc: vpc,
      vpcLinkName: `apiGatewayToNlb-${props.scope}`,
      securityGroups: [vpcLinkSecurityGroup],
    });

    const paramMapping = new cdk.aws_apigatewayv2.ParameterMapping();
    const mappingValue = cdk.aws_apigatewayv2.MappingValue.custom("/");
    paramMapping.overwritePath(mappingValue);

    const nlbIntegration =
      new cdk.aws_apigatewayv2_integrations.HttpNlbIntegration(
        "nlbIntegration",
        listener,
        {
          vpcLink: vpcLink,
          parameterMapping: paramMapping,
        },
      );

    const api = new cdk.aws_apigatewayv2.HttpApi(this, "httpApi", {
      apiName: `nlbHttpApi-${props.scope}`,
      description: "HTTP API with NLB Integration",
    });

    // `<apiGatewayUrl>/nlb` maps to `<nlbUrl>/` because of the nlbIntegration's paremeterMapping
    api.addRoutes({
      path: "/nlb",
      integration: nlbIntegration,
      methods: [cdk.aws_apigatewayv2.HttpMethod.GET],
    });

    new cdk.CfnOutput(this, "apiEndpoint", {
      description: "API Endpoint",
      value: api.apiEndpoint,
      exportName: `apiGatewayEndpoint-${props.scope}`,
    });
  }
}
