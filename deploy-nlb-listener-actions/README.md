# Deploy Network Load Balancer with Listener Actions

This CDK app deploys a Network Load Balancer whose target is a set of EC2 instances. This deployer also deploys custom listeners which forward traffic to specific a EC2 isntance depending on the port the traffic is transported through.

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

`cdk deploy -c scope=<scope>`

The app will set the environment (account and region) based on the the environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` respectively. These environment variables are set using the default AWS CLI configurations, more information can be [here](https://docs.aws.amazon.com/cdk/v2/guide/environments.html). The app can be deployed to the non-default environment by updating the CDK context with values for `account` and `region`.

This deploys a Network Load Balancer which can be used to communicate with an HTTP server on two EC2 instances. The server can be accessed by the Network Load Balancer's public DNS which can be found in AWS Console -> EC2 -> Load Balancers -> DNS_name. Port 80 on the Network Load Balancer forwards the request to one of both instances, while ports 81 and 82 forward the request to the first and second EC2 instance respectively.

### Browser

If the DNS doesn't work then verify that the browser is using `http://` and not `https://`. For example, `http://<dns>/`.

### cURL

`curl --location 'http://<nlb_dns>:80'` -> Contacts one of the two EC2 isntances

`curl --location 'http://<nlb_dns>:81'` -> Contacts the first EC2 instance

`curl --location 'http://<nlb_dns>:82'` -> Contacts the second EC2 instance

> **Warning** The compute instances deployed by this app are open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

`cdk destroy -c scope=<scope>`
