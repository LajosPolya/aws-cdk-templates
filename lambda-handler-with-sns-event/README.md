# NodeJS TypeScript AWS Lambda Handler

This is a NodeJS TypeScript AWS Lambda Handler which can be triggered by an SNS message. Once this project is built, its zipped distribution file can be uploaded to AWS and used as an AWS Lambda handler.

## Useful commands

- `npm ci` Install dependencies. Must be executed prior to runnig the build
- `npm run build` Builds the handler on Linux systems
- `npm run build-mingw` Builds the handler on non-Linux systems, for example, GitBash installed on Windows. [7zip](https://www.7-zip.org/) must be installed at `"c:\Program Files\7-Zip\7z.exe"`
