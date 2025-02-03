# Deploy RDS

This CDK app deploys an RDS cluster.

Ultimately, it's hard to showcase how to use a database with this simple example. If you want a more extensive example with an application interacting with a databse then checkout my other repo; https://github.com/LajosPolya/PopularVote

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
cdk deploy
```

### Git Bash on Windows

```console
winpty cdk.cmd deploy
```

## Destruction :boom:

> [!WARNING]
> To prevent runaway cost, always destroy this AWS environment when it's not in use.

### \*nix/Mac

```console
cdk destroy
```

### Git Bash on Windows

```console
winpty cdk.cmd destroy
```
