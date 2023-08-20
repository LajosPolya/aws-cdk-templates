# Deploy an S3 Public Bucket used as a Static Website

This app deploys a public S3 bucket which can be used as a static website. The instructions below describe how to upload an HTML document to the bucket, this HTML document will be the landing page of the static website.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
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

Once the bucket is deployed upload the `resources/index.html` to it.

`aws s3 cp resources/index.html s3://<bucketName>`

The `bucketName` is exported by the CDK and therefore printed to the CLI when this app is deployed.

Access the website by its public URL. The URL is exported by the CDK as `s3StaticWebsiteUrl` and therefore printed to the CLI when this app is deployed.

`curl --location '<s3StaticWebsiteUrl>'`

## Destruction :boom:

> **Warning** The S3 bucket deployed by this app is open to the public internet and can be accessed by anyone. To prevent unwanted cost, always destroy this AWS environment when it's not in use.

> **Warning** Deleting this bucket will delete all of its contents.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd deploy -c scope=<scope>`
