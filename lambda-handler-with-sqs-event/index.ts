import { Context, SQSEvent, SQSHandler } from "aws-lambda";

export const handler: SQSHandler = async (
  event: SQSEvent,
  context: Context,
): Promise<void> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  event.Records.map((event) => {
    console.log(`Body: ${JSON.stringify(event.body)}`);
  });
};
