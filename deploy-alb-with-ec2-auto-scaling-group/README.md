# Deploy Application Load Balancer with EC2 Auto Scaling Group

This CDK app deploys an Application Load Balancer whose target is an Auto Scaling Group used to scale a set of EC2 instances.

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

`cdk deploy -c scope=<scope> -c deploySecondInstanceCron="<cron_schedule>"`

### Git Bash on Windows

`winpty cdk.cmd deploy -c scope=<scope> -c deploySecondInstanceCron="<cron_schedule>"`

- `deploySecondInstanceCron` is a valid cron expression (in UTC) stating when to deploy the second EC2 instance. For example, `"30 15 * * *"`, translates to "run the second job at 3:30pm UTC". More info on the cron scheduler can be found at http://crontab.org/

This deploys an Application Load Balancer which can be used to communicate with an HTTP server on an EC2 instance within an Auto Scaling Group. The server can be accessed by the Application Load Balancer's public DNS which is exported by the CDK and therefore printed to the CLI when the app is deployed.

### cURL :curling_stone:

`curl <albDnsName>`

### Browser :surfer:

If the DNS doesn't work then verify that the browser is using `http://` and not `https://`. For example, `http://<albDnsName>/`.

## Destruction :boom:

> [!WARNING]
> The compute instances deployed by this app are open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope> -c deploySecondInstanceCron="<cron_schedule>"`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope> -c deploySecondInstanceCron="<cron_schedule>"`
