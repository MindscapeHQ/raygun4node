var express = require("express");
var test = require("tap").test;

var { listen, request, makeClientWithMockServer, sleep } = require("./utils");

var API_KEY = "apikey";

test("reporting express errors", async function (t) {
  const app = express();

  const testEnvironment = await makeClientWithMockServer();
  const raygunClient = testEnvironment.client;

  app.get("/", (req, res) => {
    throw new Error("surprise error!");
    res.send("response!");
  });

  app.use(raygunClient.expressHandler);

  const server = await listen(app);
  await request(`http://localhost:${server.address().port}`);
  const message = await testEnvironment.nextRequest();

  server.close();
  testEnvironment.stop();

  t.assert(
    message.details.tags.includes("UnhandledException"),
    `Expected message to include tag "UnhandledException" but instead found: ${message.details.tags}`
  );
});

test("batch reporting errors", async function (t) {
  const {client, server, stop, nextBatchRequest} = await makeClientWithMockServer({
    batch: true,
    batchFrequency: 1000
  });

  client.send(new Error('a'));
  client.send(new Error('b'));
  client.send(new Error('c'));

  try {
    const message = await nextBatchRequest({maxWait: 2000});
  } catch (e) {
    throw e;
  } finally {
    stop();
  }

  t.equals(server.entries.length, 0);
  t.equals(server.bulkEntries.length, 1);
  t.deepEquals(
    server.bulkEntries[0].map(e => e.details.error.message),
    ["a" , "b", "c"]
  );
});

test("send is bound and can be passed directly", async function (t) {
  const {client, stop, nextRequest} = await makeClientWithMockServer();

  setTimeout(client.send, 1, new Error('test!'));

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
    res.send("response!");
  });

  function testErrorHandler(err, req, res, next) {
    t.assert(err.message === "surprise error!");
    next(err);
  }

  app.use(raygunClient.expressHandler);
  app.use(testErrorHandler);

  const server = await listen(app);
  await request(`http://localhost:${server.address().port}`);

  server.close();
  testEnvironment.stop();
});
