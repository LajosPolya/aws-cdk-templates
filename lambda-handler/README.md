# NodeJS TypeScript AWS Lambda Handler

This is a simple NodeJS TypeScript AWS Lambda Handler. Once this project is built, its zipped distribution file can be used as an AWS Lambda handler.

## Useful commands

- `npm ci` Install dependencies. Must be executed prior to runnig the build
- `npm run build` Builds the handler on Linux systems
- `npm run build-mingw` Builds the handler on non-Linux systems, for example, GitBash installed on Windows. [7zip](https://www.7-zip.org/) must also be installed at `"c:\Program Files\7-Zip\7z.exe"`

## Build Docker Container

```Bash
# as a prerequisite, install and run docker
# build the lambda
npm run build # or `npm run build-mingw` on Windows GitBash CLI

docker build --platform linux/amd64 -t lambda-docker-image:test .

docker run --platform linux/amd64 -p 9000:8080 lambda-docker-image:test

# test locally in a separate CLI
docker run --platform linux/amd64 -p 9000:8080 docker-image:test
```
