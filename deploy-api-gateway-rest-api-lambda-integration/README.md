# Deploy API Gateway REST API with Lambda Integration

This CDK app deploys an API Gateway REST API backed by Lambda.

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

This deploys an API Gateway REST API backed by Lambda. This API is backed by two instances of AWS Lambda and can be accessed by the API's URL which is exported by the CDK and therefore printed to the CLI when the app is deployed.

### cURL :curling_stone:

The first lambda can be accessed by the `parent` endpoint.

```console
curl --location <api_url>/parent
```

The second lambda is a proxy lambda for `/parent/*` which means it will execute for any path that begins with `parent/`, for example:

```console
curl --location <api_url>/parent/child
```

Where `api_url` is exported by the CDK and therefore printed to the CLI during deployment.

### Browser :surfer:

The API will respond successfully if the URL is pasted into the browser.

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
