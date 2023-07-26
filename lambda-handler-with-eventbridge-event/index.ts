import { Context, EventBridgeEvent } from "aws-lambda";

export const handler = async (
  event: EventBridgeEvent<string, any>,
  context: Context,
): Promise<any> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);
};
