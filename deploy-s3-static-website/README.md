# Deploy an S3 Public Bucket used as a Static Website

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

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

Once the bucket is deployed upload the `resources/index.html` to it.

`aws s3 cp resources/index.html s3://<bucket_name>`

Access the website by its public URL. The URL can be found by visiting the AWS Consol -> S3 -> Buckets -> bucket_name -> Properties -> Static Website Hosting -> Bucket website endpoint

`curl --location 'http://<s3-static-website-url>'`

> **Warning** The S3 bucket deployed by this app is open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

> **Warning** Deleting this bucket will delete all of its contents.

`cdk destroy -c scope=<scope>"`
