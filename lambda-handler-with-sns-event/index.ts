import { Context, SNSEvent, SNSHandler } from "aws-lambda";

export const handler: SNSHandler = async (
  event: SNSEvent,
  context: Context,
): Promise<any> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  event.Records.map((event) => {
    console.log(`Body: ${event.Sns.Message}`);
  });
};
