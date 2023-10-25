# Deploy an S3 Private Bucket

This app deploys a private S3 bucket. The bucket can be used to store any type of file such as zipped lambda distribution files.

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

Once the bucket is deployed upload a file to it.

`aws s3 cp <filename> s3://<bucketName>`

The `bucketName` is exported by the CDK and therefore printed to the CLI when this app is deployed.

## Destruction :boom:

> **Warning** Deleting this bucket will delete all of its contents.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd deploy -c scope=<scope>`
