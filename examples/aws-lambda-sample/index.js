const raygun = require("raygun");
const { awsHandler } = require("@raygun/aws-lambda");

const client = new raygun.Client().init({ apiKey: process.env.RAYGUN });

exports.handler = awsHandler({ client }, async function (event, context) {
  throw "It's an AWS error!";
});
