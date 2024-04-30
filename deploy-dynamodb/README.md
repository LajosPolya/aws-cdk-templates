# Deploy DynamoDB Table

This CDK app deploys a DynamoDB Table with a Partition Key and Sort Key, and a Global Secondary Index with a Partition Key and Sort Key.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run check` checks if files are formatted
- `npm run format` formats files
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Deployment :rocket:

### \*nix/Mac

`cdk deploy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd deploy -c scope=<scope>`

The app will set the environment (account and region) based on the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

This deploys a DynamoDB Table with instructions on how to insert and get items from the table. The table defines two Global Indexes. The first having a Partition Key in the `publisherId` and a Sort Key on the `bookTitle`, and the Second Global Index having a Partition Key on `bookTitle` and a Sort Key on `year`.

## Writing to and Reading from the Table

In the example below `<table_name>` represents the DybamoDB Table's name, this name is exported by the CDK and therefore printed to the CLI after the deployment is complete.

### Write an item to the table

`aws dynamodb put-item --table-name <table_name> --item "{\"publisherId\": {\"N\": \"1234\"}, \"bookTitle\": {\"S\": \"My First Book\"}, \"year\": {\"N\": \"2024\"}}"`

### Fetching an item by Partition Key

`aws dynamodb get-item --table-name <table_name> --key "{\"publisherId\": {\"N\": \"1234\"}, \"bookTitle\": {\"S\": \"My First Book\"}}"`

### Query an item by Non-Partition Key attributes

This operation searches through the table items on client side and is therefore inefficient and not recommended.

`aws dynamodb query --table-name <table_name> --key-conditions "{\"publisherId\": { \"AttributeValueList\": [{\"N\": \"1234\"}], \"ComparisonOperator\": \"EQ\"}}"`

## Destruction :boom:

> **Warning** To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope>`
