# NodeJS TypeScript AWS Batch Job Script

This is a NodeJS TypeScript AWS Batch Job script which prints a string to the consose and returns the same string. Once this project is built, its docker image can be uploadted to AWS ECR and used as an AWS Batch Job.

## Useful commands

- `npm run build` Builds the handler on Linux systems
- `npm run build-mingw` Builds the handler on non-Linux systems, for example, GitBash installed on Windows. [7zip](https://www.7-zip.org/) must also be installed at `"c:\Program Files\7-Zip\7z.exe"`

## Build Process

```Bash
npm ci
npm run build
# npm run build-mingw # if build on Windows using Git Bash

docker build . -t aws-cdk-projects/node-batch-job
docker run aws-cdk-projects/node-batch-job

```

To deploy this Docker image to AWS ECR follow the instructions at [deploy-ecr](../deploy-ecr/README.md).
