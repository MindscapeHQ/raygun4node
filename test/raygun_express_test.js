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

  client.sendWithCallback(new Error("a"));
  client.sendWithCallback(new Error("b"));
  client.sendWithCallback(new Error("c"));

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
  const { client, server, stop, nextBatchRequest } =
    await makeClientWithMockServer({
      batch: true,
      batchFrequency: 1000,
    });

  client.sendWithCallback(new Error("a".repeat(MAX_BATCH_SIZE_BYTES)));
  client.sendWithCallback(new Error("b"));

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

  setTimeout(client.sendWithCallback, 1, new Error("test!"));

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

  raygunClient.sendWithCallback(new Error("example error"));

  const message = await nextRequest;

  testEnvironment.stop();

  t.same(message.details.user, { email: "test@null.null" });
});

test("string exceptions are sent intact", async function (t) {
  t.plan(1);

  const testEnvironment = await makeClientWithMockServer();
  const raygunClient = testEnvironment.client;

  const nextRequest = testEnvironment.nextRequest();

  raygunClient.sendWithCallback("my string error");

  const message = await nextRequest;

  testEnvironment.stop();

  t.same(message.details.error.message, "my string error");
});
