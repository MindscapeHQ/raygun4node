var express = require("express");
var test = require("tap").test;

const { MAX_BATCH_SIZE_BYTES } = require("../lib/raygun.batch.ts");
var { listen, request, makeClientWithMockServer } = require("./utils");

test("reporting express errors", async function (t) {
  const app = express();

  const testEnvironment = await makeClientWithMockServer();
  const raygunClient = testEnvironment.client;

  app.get("/", (req, res) => {
    throw new Error("surprise error!");
  });

  app.use(raygunClient.expressHandler);

  const server = await listen(app);
  await request(`http://localhost:${server.address().port}`);
  const message = await testEnvironment.nextRequest();

  server.close();
  testEnvironment.stop();

  t.ok(
    message.details.tags.includes("UnhandledException"),
    `Expected message to include tag "UnhandledException" but instead found: ${message.details.tags}`,
  );
});

test("batch reporting errors", async function (t) {
  const { client, server, stop, nextBatchRequest } =
    await makeClientWithMockServer({
      batch: true,
      batchFrequency: 1000,
    });

  client.send(new Error("a"));
  client.send(new Error("b"));
  client.send(new Error("c"));

  try {
    await nextBatchRequest({ maxWait: 2000 });
  } finally {
    stop();
  }

  t.equal(server.entries.length, 0);
  t.equal(server.bulkEntries.length, 1);
  t.same(
    server.bulkEntries[0].map((e) => e.details.error.message),
    ["a", "b", "c"],
  );
});

test("batch transport discards massive errors", async function (t) {
  t.plan(5);
  const { client, server, stop, nextBatchRequest } =
    await makeClientWithMockServer({
      batch: true,
      batchFrequency: 1000,
    });

  client.send(new Error("a".repeat(MAX_BATCH_SIZE_BYTES))).catch((error) => {
    // Will throw message too big error
    t.ok(error);
  });

  client.send(new Error("b")).then((message) => {
    // Will complete normally
    t.ok(message);
  });

  try {
    await nextBatchRequest({ maxWait: 2000 });
  } finally {
    stop();
  }

  t.equal(server.entries.length, 0);
  t.equal(server.bulkEntries.length, 1);
  t.same(
    server.bulkEntries[0].map((e) => e.details.error.message),
    ["b"],
  );
});

test("send is bound and can be passed directly", async function (t) {
  const { client, stop, nextRequest } = await makeClientWithMockServer();

  setTimeout(client.send, 1, new Error("test!"));

  await nextRequest();

  stop();
});

test("exceptions are propagated by middleware", async function (t) {
  t.plan(1);
  const app = express();

  const testEnvironment = await makeClientWithMockServer();
  const raygunClient = testEnvironment.client;

  app.get("/", (req, res) => {
    throw new Error("surprise error!");
  });

  function testErrorHandler(err, req, res, next) {
    t.equal(err.message, "surprise error!");
    next(err);
  }

  app.use(raygunClient.expressHandler);
  app.use(testErrorHandler);

  const server = await listen(app);
  await request(`http://localhost:${server.address().port}`);

  server.close();
  testEnvironment.stop();
});

test("user function is called even if request is not present", async function (t) {
  t.plan(1);

  const testEnvironment = await makeClientWithMockServer();
  const raygunClient = testEnvironment.client;

  raygunClient.user = () => ({ email: "test@null.null" });

  const nextRequest = testEnvironment.nextRequest();

  raygunClient.send(new Error("example error"));

  const message = await nextRequest;

  testEnvironment.stop();

  t.same(message.details.user, { email: "test@null.null" });
});

test("provide userInfo in send method", async function (t) {
  t.plan(1);

  const testEnvironment = await makeClientWithMockServer();
  const raygunClient = testEnvironment.client;

  const userInfo = { email: "test@null.null" };

  const nextRequest = testEnvironment.nextRequest();

  raygunClient.send(new Error("example error"), { userInfo });

  const message = await nextRequest;

  testEnvironment.stop();

  t.same(message.details.user, { email: "test@null.null" });
});

test("string exceptions are sent intact", async function (t) {
  t.plan(1);

  const testEnvironment = await makeClientWithMockServer();
  const raygunClient = testEnvironment.client;

  const nextRequest = testEnvironment.nextRequest();

  raygunClient.send("my string error");

  const message = await nextRequest;

  testEnvironment.stop();

  t.same(message.details.error.message, "my string error");
});

test("modify error payload in onBeforeSend", async function (t) {
  t.plan(1);

  const testEnvironment = await makeClientWithMockServer();
  const raygunClient = testEnvironment.client;

  const nextRequest = testEnvironment.nextRequest();

  // Modify message in onBeforeSend
  raygunClient.onBeforeSend((message) => {
    message.details.error.message = "New Message";
    return message;
  });

  // Send "Original Message"
  await raygunClient.send(new Error("Original Message"));

  const message = await nextRequest;

  testEnvironment.stop();

  // expect modified "New Message"
  t.same(message.details.error.message, "New Message");
  t.end();
});
