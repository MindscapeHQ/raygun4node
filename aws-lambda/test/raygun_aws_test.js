const test = require("tap").test;
const { makeClientWithMockServer } = require("../../test/utils");
const { awsHandler } = require("../lib/raygun.aws");

test("capture AWS lambda errors", async function (t) {
  // Setup client
  const testEnvironment = await makeClientWithMockServer();
  const client = testEnvironment.client;

  // Setup lambda that crashes
  const lambda = awsHandler({ client }, async (event, context) => {
    throw "error";
  });

  const nextRequest = testEnvironment.nextRequest();

  try {
    // Call to lambda
    await lambda({ event: "event" }, { functionName: "test" });
  } catch (e) {
    // error should be re-thrown to AWS
    t.equal(e, "error");
  }

  const message = await nextRequest;

  testEnvironment.stop();

  t.equal(message.details.error.message, "error");
});

test("pass result to AWS Lambda", async function (t) {
  t.plan(1);
  // Setup client
  const testEnvironment = await makeClientWithMockServer();
  const client = testEnvironment.client;

  // Setup lambda that returns a result
  const lambda = awsHandler({ client }, async (event, context) => {
    return { result: true };
  });

  try {
    // Call to lambda
    const response = await lambda({ event: "event" }, { functionName: "test" });
    t.equal(response.result, true);
  } catch (e) {
    t.fail();
  }

  testEnvironment.stop();
});

test("legacy AWS callback implementation succeeds", async function (t) {
  t.plan(1);
  // Setup client
  const testEnvironment = await makeClientWithMockServer();
  const client = testEnvironment.client;

  // Setup lambda that calls to callback with a result
  const lambda = awsHandler({ client }, (event, context, callback) => {
    callback(null, { result: true });
  });

  try {
    // Call to lambda
    const response = await lambda({ event: "event" }, { functionName: "test" });
    t.equal(response.result, true);
  } catch (e) {
    t.fail();
  }

  testEnvironment.stop();
});

test("legacy AWS callback implementation fails with callback", async function (t) {
  // Setup client
  const testEnvironment = await makeClientWithMockServer();
  const client = testEnvironment.client;

  // Setup lambda that calls to callback with error
  const lambda = awsHandler({ client }, (event, context, callback) => {
    callback("error");
  });

  const nextRequest = testEnvironment.nextRequest();

  try {
    // Call to lambda
    await lambda({ event: "event" }, { functionName: "test" });
  } catch (e) {
    // error should be re-thrown to AWS
    t.equal(e, "error");
  }

  const message = await nextRequest;

  testEnvironment.stop();

  t.equal(message.details.error.message, "error");
});

test("legacy AWS callback implementation fails with throw", async function (t) {
  // Setup client
  const testEnvironment = await makeClientWithMockServer();
  const client = testEnvironment.client;

  // Setup lambda that calls to callback with error
  const lambda = awsHandler({ client }, (event, context, callback) => {
    throw "error";
  });

  const nextRequest = testEnvironment.nextRequest();

  try {
    // Call to lambda
    await lambda({ event: "event" }, { functionName: "test" });
  } catch (e) {
    // error should be re-thrown to AWS
    t.equal(e, "error");
  }

  const message = await nextRequest;

  testEnvironment.stop();

  t.equal(message.details.error.message, "error");
});

test("include scoped breadcrumbs", async function (t) {
  // Setup client
  const testEnvironment = await makeClientWithMockServer();
  const client = testEnvironment.client;

  // Setup lambda that crashes
  const lambda = awsHandler({ client }, async (event, context) => {
    // Add a custom breadcrumb
    client.addBreadcrumb("custom breadcrumb");
    // Fail
    throw "error";
  });

  const nextRequest = testEnvironment.nextRequest();

  try {
    // Call to lambda
    await lambda({ event: "event" }, { functionName: "test" });
  } catch (e) {
    // error should be re-thrown to AWS
    t.equal(e, "error");
  }

  const message = await nextRequest;

  testEnvironment.stop();

  // Includes both internal and custom breadcrumbs
  t.equal(message.details.breadcrumbs.length, 2);
  // internal breadcrumb
  t.equal(message.details.breadcrumbs[0].message, "Running AWS Function: test");
  // custom breadcrumb
  t.equal(message.details.breadcrumbs[1].message, "custom breadcrumb");
});
