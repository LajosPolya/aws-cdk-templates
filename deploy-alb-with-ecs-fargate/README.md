# Deploy Application Load Balancer with ECS Fargate

This CDK app deploys an Application Load Balancer whose target is a set of ECS Fargate tasks.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run check` checks if files are formatted
- `npm run format` formats files
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Deployment :rocket:

Prior to deploying this stack, run Docker and [build the API](../api/README.md) and verify that Docker is running.

### \*nix/Mac

`cdk deploy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd deploy -c scope=<scope>`

- `ecrName` represents the name of the Elastic Container Repository containing the image to run on the ECS Fargate tasks. Follow the instructions in [deploy-ecr](../deploy-ecr/README.md) to deploy an image of a simple API to an AWS Elastic Container Repository

The app will set the environment (account and region) based on the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

This deploys an Application Load Balancer which can be used to communicate with an HTTP server on two ECS Fargate tasks. The Service's Autoscsaling will trigger if the average CPU goes above 80%. The server can be accessed by the Application Load Balancer's public DNS which is exported by the CDK and therefore printed to the CLI when the app is deployed.

### cURL :curling_stone:

`curl <albDnsName>/health`

Where `albDnsName` is the DNS name of the Application Load Balancer in front of the Fargate task, it's exported by the CDK and therefore printing to the screen during deployment.

To trigger high CPU usage and therefore the Autoscaling Group call the `/max-cpu` endpoint. Call this endpoint at least a few times to guarantee that both initial tasks are hit by the load balancer. It may take a few mins for high CPU to register and for the third task to boot.

`curl <albDnsName>/max-cpu`

It may take a few minutes for the third instance to boot. Use the AWS CLI to verify that three instances are running.

`aws ecs list-tasks --cluster <clusterName>`

Where `clusterName` is the name of the cluster, it's exported by tje CDK and therefore printed to the screen during deployment.

### Browser :surfer:

If the DNS doesn't work then verify that the browser is using `http://` and not `https://`. For example, `http://<albDnsName>/health`.

## Destruction :boom:

> **Warning** The compute instances deployed by this app are open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

`cdk destroy -c scope=<scope>`

### Git Bash on Windows

`winpty cdk.cmd destroy -c scope=<scope>`
