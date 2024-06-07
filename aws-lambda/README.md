# Raygun AWS Lambda + Node

[![GitHub CI](https://github.com/MindscapeHQ/raygun4node/actions/workflows/aws-lambda.yml/badge.svg)](https://github.com/MindscapeHQ/raygun4node/actions)

Raygun.com package for AWS Lambda + Node, written in TypeScript.

This package improves the experience when using Raygun with AWS Lambda using JavaScript.

Provides two main advantages compared to using Raygun directly:

1. Captures any uncaught error in the AWS Lambda function and reports it to Raygun automatically.
2. Scopes Breadcrumbs to the current function session.

## Getting Started

Install the module with: `npm install @raygun.io/aws-lambda`

Set up the Raygun client as described in the [Raygun package](https://www.npmjs.com/package/raygun).

Import the `awsHandler` method:

```js
const { awsHandler } = require("@raygun/aws-lambda");
```

### Adding Raygun to a AWS Lambda function

To add Raygun to an existing AWS Lambda function, wrap the existing handler implementation with the `awsHandler` function.

Before:

```js
exports.handler = async function (event, context) {
    // your code
}
```

After:

```js
// 1. Configure your Raygun client outside the AWS Lambda function
const client = new Raygun.client().init( ... );

// 2. Wrap the existing function with awsHandler
// 3. Pass the client as the first parameter
exports.handler = awsHandler({ client }, async function (event, context) {
    // your code
});
```

### Using AWS Lambda functions with callbacks

Raygun AWS Lambda handler also supports functions with three parameters and callbacks.

```js
// Wrap the existing function with callback
exports.handler = awsHandler({ client }, function (event, context, callback) {
    // your code
});
```

### Sending errors to Raygun from an AWS Lambda function

Any errors thrown in code will be automatically captured by the `awsHandler`.

```js
exports.handler = awsHandler({ client }, async function (event, context) {
    // Captured by awsHandler and reported to Raygun
    throw "error";
});
```

Errors are also automatically reported when using the callback version.

```js
exports.handler = awsHandler({ client }, function (event, context, callback) {
    // Captured by awsHandler and reported to Raygun
    callback("error", null);
});
```

As well, you can keep using the `send()` method.

```js
exports.handler = awsHandler({ client }, async function (event, context) {
    await client.send("error");
});
```

**Important:** The `awsHandler` will rethrow the error back to AWS once it has been captured.

### Adding breadcrumbs to Raygun error reports

Breadcumbs are included automatically to all error reports sent from the `awsHandler` or when using the `send()` method.

Call to `client.addBreadcrumb()` to add breadcrumbs.

```js
exports.handler = awsHandler({ client }, async function (event, context) {
    // Add a breadcrumb
    client.addBreadcrumb("breadcrumb");
    
    // Captured error includes the above breadcrumb
    throw "error";
});
```

### AWS Lambda function context in Custom Data

The `awsHandler` also adds automatically the function call context in the "Custom Data" payload of the error report.

This payload can be found in the "Custom" tab in the Raygun Crash Reporting error report page.

```
context: {
  callbackWaitsForEmptyEventLoop: true,
  functionVersion: "$LATEST",
  functionName: "xyz",
  memoryLimitInMB: "128",
  logGroupName: "/aws/lambda/xyz",
  logStreamName: "2024/05/31/[$LATEST]xyz",
  invokedFunctionArn: "arn:aws:lambda:xyz",
  awsRequestId: "xyz"
}
```

## Release History

[View the changelog here](CHANGELOG.md)

## License

Copyright (c) 2024 Raygun Limited

Licensed under the MIT license.

