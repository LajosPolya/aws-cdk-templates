import { ALBEvent, ALBHandler, ALBResult, Context } from "aws-lambda";

export const handler: ALBHandler = async (
  event: ALBEvent,
  context: Context,
): Promise<ALBResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  return {
    "isBase64Encoded": false,
    "statusCode": 200,
    "statusDescription": "200 OK",
    "headers": {
        "Content-Type": "application/json"
    },
    "body": "Successfully executed a TypeScript Lambda Handler (Check the logs for more information)"
}
};
