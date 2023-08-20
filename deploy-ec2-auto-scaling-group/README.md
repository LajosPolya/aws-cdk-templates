# Deploy EC2 Auto Scaling Group

This CDK app deploys EC2 instances scaled using an Auto Scaling Group.

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

### *nix/Mac

`cdk deploy -c scope=<scope> -c deploySecondInstanceCron="<cron_schedule>"`

### Git Bash on Windows

`winpty cdk.cmd deploy -c scope=<scope> -c deploySecondInstanceCron="<cron_schedule>"`

- `deploySecondInstanceCron` is a valid cron expression (in UTC) stating when to deploy the second EC2 instance. For example, `"30 15 * * *"`, translates to "run the second job at 3:15pm UTC". More info on the cron scheduler can be found at http://crontab.org/

The app will set the environment (account and region) based on the the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

This deploys an HTTP server on an EC2 instance within an Auto Scaling Group. The server can be accessed by either the public IP or the public DNS which can be found by aither following the instructions below or by visiting the AWS Console.

`aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names <autoScalingGroupName> | jq ".AutoScalingGroups[0].Instances[].InstanceId" | aws ec2 describe-instances --instance-ids | jq ".Reservations[].Instances[].PublicDnsName"`

- `autoScalingGroupName` the name of the Auto Scaling Group. This value is exported by the CDK and therefore printed to the command line when the app is deployed.

The above list of commands outputs a public DNS name for each EC2 isntance in the specified Auto Scaling Group. Note that both the [AWS CLI](https://github.com/aws/aws-cli) and [jq](https://jqlang.github.io/jq/download/) must be installed. Each public DNS name can be used to communicate with the servers.

### cURL

`curl --location '<publicDnsName>'`

### Browser

If the IP address or DNS doesn't work then verify that the browser is using `http://` and not `https://`. For example, `http://<ip_address>/` or `http://<dns>/`.

## Destruction :boom:

> **Warning** The compute instances deployed by this app are open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### *nix/Mac

`cdk destroy -c scope=<scope> -c deploySecondInstanceCron="<cron_schedule>"`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope> -c deploySecondInstanceCron="<cron_schedule>"`
