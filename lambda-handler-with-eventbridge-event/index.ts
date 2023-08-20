import { Context, EventBridgeEvent, EventBridgeHandler } from "aws-lambda";

export const handler: EventBridgeHandler<string, any, void> = async (
  event: EventBridgeEvent<string, any>,
  context: Context,
): Promise<void> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);
};
