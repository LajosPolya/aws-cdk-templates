# NodeJS TypeScript AWS Lambda Handler

This is a simple NodeJS TypeScript AWS Lambda Handler. Once this project is built, its zipped distribution file can be used as an AWS Lambda handler.

## Useful commands

- `npm ci` Install dependencies. Must be executed prior to runnig the build
- `npm run build` Builds the handler on Linux systems
- `npm run build-mingw` Builds the handler on non-Linux systems, for example, GitBash installed on Windows. [7zip](https://www.7-zip.org/) must be installed at `"c:\Program Files\7-Zip\7z.exe"`

## Build Lambda Handler

```Bash
# build the lambda
npm ci
npm run build # or `npm run build-mingw` on Windows GitBash CLI
```

## Build Docker Container

```Bash
# as a prerequisite, install and run docker
# build the lambda
npm ci
npm run build # or `npm run build-mingw` on Windows GitBash CLI

# build docker if necessary
docker build --platform linux/amd64 -t <image_name>:<image_tag> .

docker run --platform linux/amd64 -p 9000:8080 <image_name>:<image_tag>

# test locally in a separate CLI
curl http://localhost:9000/2015-03-31/functions/function/invocations -d '{}'
```

> [!NOTE]
> This Dockerfile is used by some of the deployers, update with care.
