# Deploy a Lambda triggered by an ALB

This CDK app deploys a Lambda. This Lambda is configured to be triggered by an ALB event. The Lambda's code is contained in this repo for simplicity.

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

Before deploying this lambda, first follow the instructions in [lambda-handler-with-alb-event](../lambda-handler-with-alb-event/README.md) to build a zip file of the Lambda handler's code.

### \*nix/Mac

`cdk deploy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd deploy -c scope=<scope>`

The app will set the environment (account and region) based on the the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

This deploys a Lambda which when invoked by an ALB event will synchronously respond with a JSON body. The Lambda can be accessed by the Application Load Balancer's public DNS which is exported by the CDK and therefore printed to the CLI when the app is deployed.

### cURL

`curl --location 'http://<alb_dns>'`

### Browser

If the DNS doesn't work then verify that the browser is using `http://` and not `https://`. For example, `http://<alb_dns>/`.

To find the output of the Lambda visit the AWS Console and go to CloudWatch -> Log groups -> `/aws/lambda/lambdaTriggeredByAlb-<scope>` -> and click on the most recent Log Stream. The Lambda's event and context objects will be printed in the logs.

## Destruction :boom:

> **Warning** To prevent accidental execution of the lambda and to prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd deploy -c scope=<scope>`
