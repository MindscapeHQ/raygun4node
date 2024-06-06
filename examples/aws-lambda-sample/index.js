const raygun = require("raygun");
const { awsHandler } = require("@raygun/aws-lambda");

const client = new raygun.Client().init({ apiKey: process.env.RAYGUN });

exports.handler = awsHandler({ client }, async function (event, context) {
  client.addBreadcrumb("breadcrumb on event received");
  if (event["error"]) {
    client.addBreadcrumb("event has error data!");
    throw "It's an AWS error!";
  } else {
    return "all good!";
  }
});
