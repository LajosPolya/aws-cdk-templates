# NodeJS TypeScript AWS Lambda Handler

This is a NodeJS TypeScript AWS Lambda Handler which is meant to be deployed within a Step Function. Once this project is built, its zipped distribution file can be uploaded to AWS and used as an AWS Lambda handler.

This Lambda handler takes a JSON object of type `IncomingEvent` as input which is defined in `index.ts`. Depending on the string assigned to the `task` field the handler will either throw a specific error or return a success message.

## Useful commands

- ``` Bash
        npm ci
``` Install dependencies. Must be executed prior to runnig the build
- `npm run build` Builds the handler on Linux systems
- `npm run build-mingw` Builds the handler on non-Linux systems, for example, GitBash installed on Windows. [7zip](https://www.7-zip.org/) must be installed at `"c:\Program Files\7-Zip\7z.exe"`
