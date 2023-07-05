# Deploy an S3 Public Bucket used as a Static Website

This app deploys a private S3 bucket. The bucket can be used to store any type of file such as zipped lambda distribution files.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npm run check` checks if files are formatted
- `npm run format` formats files
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Deployment

`cdk deploy -c scope=<scope>"`

Once the bucket is deployed upload a file to it.

`aws s3 cp <filename> s3://<bucket_name>`

> **Warning** Deleting this bucket will delete all of its contents.

`cdk destroy -c scope=<scope>"`
