# Deploy API Gateway Websocket API with Lambda Integration

This CDK app deploys an API Gateway Websocket API backed by Lambda.

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

```console
cdk deploy -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd deploy -c scope=<scope>
```

This deploys an API Gateway Websocket API backed by Lambda. This API is backed by an instance of AWS Lambda and can be accessed by the API's **Websocket URL** which is exported by the CDK and therefore printed to the CLI when the app is deployed.

### Make a request to the Websocket URL

1. Install `wscat`

```console
npm install -g wscat
```

2. Connect to the Websocket API

```console
wscat -c <websocket_url>
```

3. Send a message to the Websocket API

Sending a message to the Websocket API will execute the lambda that's integrated with it. The API responds to the following actions: `connect`, `disconnect`, or `default` routes. For example:

```console
{"action":"default"}
```

To exit the CLI press `CTRL+C`

## Destruction :boom:

> [!WARNING]
> The API Gateway deployed by this app is open to the public internet and can be accessed by anyone. To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

```console
cdk destroy -c scope=<scope>
```

### Git Bash on Windows

```console
winpty cdk.cmd destroy -c scope=<scope>
```
