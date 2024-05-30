import { Client } from "raygun";
import { Context, Handler } from "aws-lambda";

export type AwsHandlerConfig = {
  client: Client;
};

// Custom async Handler type without callback
type AsyncHandler<TEvent, TResult> = (
  event: TEvent,
  context: Context,
) => Promise<TResult>;

// Wrap sync (event, context, callback) in Promise to convert to async (event, context)
function createAsyncHandler<TEvent, TResult>(
  handler: Handler<TEvent, TResult>,
): AsyncHandler<TEvent, TResult> {
  return (event: TEvent, context: Context) =>
    new Promise((resolve, reject) => {
      handler(event, context, (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result as never);
        } else {
          reject();
        }
      });
    });
}

export function awsHandler<TEvent, TResult>(
  awsHandlerConfig: AwsHandlerConfig,
  handler: Handler<TEvent, TResult>,
): Handler<TEvent, TResult> {
  let asyncHandler: AsyncHandler<TEvent, TResult>;
  if (handler.length <= 2) {
    // handler is async (event, context)
    asyncHandler = handler as AsyncHandler<TEvent, TResult>;
  } else {
    // handler is sync (event, context, callback)
    asyncHandler = createAsyncHandler(handler);
  }

  return async (event: TEvent, context: Context) => {
    awsHandlerConfig.client.addBreadcrumb(`Function: ${context.functionName}`);

    try {
      // Call to original handler and return value
      return await asyncHandler(event, context);
    } catch (e) {
      // Capture error and send to Raygun
      if (e instanceof Error || typeof e === "string") {
        await awsHandlerConfig.client.send(e, {
          customData: context,
          tags: ["awsHandler"],
        });
      } else {
        await awsHandlerConfig.client.send(`awsHandler error: ${e}`, {
          customData: context,
          tags: ["awsHandler"],
        });
      }

      // rethrow exception to AWS
      throw e;
    }
  };
}
