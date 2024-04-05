# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template

Add author(id, name) -> publisher(id?, name) -> book (title, date, sales)
editor? stores?

`aws dynamodb put-item --table-name dynamo-lpolya --item "{\"publisherId\": {\"N\": \"1234\"}, \"bookTitle\": {\"S\": \"Lajos' Book\"}, \"year\": {\"N\": \"2024\"}}"`

`aws dynamodb get-item --table-name dynamo-lpolya1 --key "{\"publisherId\": {\"N\": \"1234\"}, \"bookTitle\": {\"S\": \"Lajos' Book\"}}"`

`aws dynamodb query --table-name dynamo-lpolya --key-conditions "{\"publisherId\": { \"AttributeValueList\": [{\"N\": \"1234\"}], \"ComparisonOperator\": \"EQ\"}}"`


Add warning that this shows how to create a table, put items, and query items. It is not meant
to be an example of how to design indexes or choose partitions keys (is author name a good partition key?)