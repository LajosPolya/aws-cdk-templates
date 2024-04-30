import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DeployDynamodbStackProps extends cdk.StackProps {
  scope: string;
}

export class DeployDynamodbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeployDynamodbStackProps) {
    super(scope, id, props);

    const table = new cdk.aws_dynamodb.Table(this, "table", {
      tableName: `dynamo-${props.scope}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {
        name: "publisherId",
        type: cdk.aws_dynamodb.AttributeType.NUMBER,
      },
      sortKey: {
        name: "bookTitle",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
    });

    table.addGlobalSecondaryIndex({
      indexName: "book",
      partitionKey: {
        name: "bookTitle",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "year",
        type: cdk.aws_dynamodb.AttributeType.NUMBER,
      },
    });

    new cdk.CfnOutput(this, "tableName", {
      description: "The Table's name",
      value: table.tableName,
      exportName: `tableName-${props.scope}`,
    });
  }
}
