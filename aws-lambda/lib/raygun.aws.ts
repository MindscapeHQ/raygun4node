import { Client } from "raygun";
import { Context, Handler } from "aws-lambda";
import { runWithBreadcrumbsAsync } from "raygun/build/raygun.breadcrumbs";

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

async function runHandler<TEvent, TResult>(
  awsHandlerConfig: AwsHandlerConfig,
  event: TEvent,
  context: Context,
  asyncHandler: AsyncHandler<TEvent, TResult>,
) {
  awsHandlerConfig.client.addBreadcrumb(
    `Running AWS Function: ${context.functionName}`,
  );

  try {
    // Call to original handler and return value
    return await asyncHandler(event, context);
  } catch (e) {
    // Capture error and send to Raygun

    // Prepare send parameters
    const customData = {
      context: context,
    };
    const tags = ["AWS Handler"];
    const sendParams = {
      customData,
      tags,
    };

    if (e instanceof Error || typeof e === "string") {
      await awsHandlerConfig.client.send(e, sendParams);
    } else {
      await awsHandlerConfig.client.send(`AWS Handler error: ${e}`, sendParams);
    }

    // rethrow exception to AWS
    throw e;
  }
}

export function awsHandler<TEvent, TResult>(
  awsHandlerConfig: AwsHandlerConfig,
  handler: Handler<TEvent, TResult>,
): AsyncHandler<TEvent, TResult> {
  let asyncHandler: AsyncHandler<TEvent, TResult>;
  if (handler.length <= 2) {
    // handler is async (event, context)
    asyncHandler = handler as AsyncHandler<TEvent, TResult>;
  } else {
    // handler is sync (event, context, callback)
    asyncHandler = createAsyncHandler(handler);
  }

  return async (event: TEvent, context: Context) => {
    // Scope breadcrumbs to this handler event
    return runWithBreadcrumbsAsync(() => {
      return runHandler(awsHandlerConfig, event, context, asyncHandler);
    });
  };
}
