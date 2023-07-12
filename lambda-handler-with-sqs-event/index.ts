import { Context, SQSEvent } from "aws-lambda";

export const handler = async (
  event: SQSEvent,
  context: Context,
): Promise<any> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  event.Records.map((event) => {
    console.log(`Body: ${JSON.stringify(event.body)}`);
  });
};
