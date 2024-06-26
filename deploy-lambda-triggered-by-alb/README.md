# Deploy a Lambda triggered by an ALB

This CDK app deploys a Lambda. This Lambda is configured to be triggered by an ALB event. The Lambda's code is contained in this repo for simplicity.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run check` checks if files are formatted
- `npm run format` formats files
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Deployment :rocket:

Before deploying this lambda, first follow the instructions in [lambda-handler-with-alb-event](../lambda-handler-with-alb-event/README.md) to build a zip file of the Lambda handler's code.

### \*nix/Mac

```console
cdk deploy -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd deploy -c scope=<scope>
```

This deploys a Lambda which when invoked by an ALB event will synchronously respond with a JSON body. The Lambda can be accessed by the Application Load Balancer's public DNS which is exported by the CDK and therefore printed to the CLI when the app is deployed.

### cURL :curling_stone:

```console
curl <alb_dns>
```

### Browser :surfer:

If the DNS doesn't work then verify that the browser is using `http://` and not `https://`. For example, `http://<alb_dns>/`.

To find the output of the Lambda visit the AWS Console and go to CloudWatch -> Log groups -> `<logGroupName>` -> and click on the most recent Log Stream. The Lambda's event and context objects will be printed in the logs. The `logGroupName` represents the Lambda's Log Group name which is exported by the CDK and therefore printed to the command line when the app is deployed.

## Destruction :boom:

> [!WARNING]
> To prevent accidental execution of the lambda and to prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

```console
cdk destroy -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd destroy -c scope=<scope>
```
