import { Client } from "raygun";
import { Handler } from "aws-lambda";

export type AwsHandlerConfig = {
  client: Client;
};

export function awsHandler<TEvent, TResult>(
  awsHandlerConfig: AwsHandlerConfig,
  handler: Handler<TEvent, TResult>,
): Handler<TEvent, TResult> {
  return () => {
    awsHandlerConfig.client.addBreadcrumb("AWS call");
  };
}
