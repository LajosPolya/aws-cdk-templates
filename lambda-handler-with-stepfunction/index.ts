import { Context, Handler } from "aws-lambda";

export const handler: Handler<IncomingEvent, any> = async (
  event: IncomingEvent,
  context: Context,
): Promise<any> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  if (event.task == null) {
    throw new UndefinedTaskError();
  } else if (event.task === "retry") {
    throw new RetryableError();
  } else if (event.task === "recover") {
    throw new RecoverableTaskError();
  } else if (event.task === "succeed") {
    return {
      message: "success",
    };
  } else {
    throw new UnknownTaskError();
  }
};

interface IncomingEvent {
  task: string;
}

class UndefinedTaskError extends Error {
  constructor() {
    super("Task not defined");
    this.name = "UndefinedTaskError";
    Object.setPrototypeOf(this, UndefinedTaskError.prototype);
  }
}

class RetryableError extends Error {
  constructor() {
    super("Task will be retried");
    this.name = "RetryableError";
    Object.setPrototypeOf(this, RetryableError.prototype);
  }
}

class UnknownTaskError extends Error {
  constructor() {
    super("Task not known");
    this.name = "UnknownTaskError";
    Object.setPrototypeOf(this, UnknownTaskError.prototype);
  }
}

class RecoverableTaskError extends Error {
  constructor() {
    super("Recoverable error");
    this.name = "RecoverableTaskError";
    Object.setPrototypeOf(this, RecoverableTaskError.prototype);
  }
}
