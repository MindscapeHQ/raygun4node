const express = require("express");
const deepEqual = require("assert").deepEqual;
const test = require("tap").test;
const { listen, makeClientWithMockServer, request } = require("./utils");
const Raygun = require("../lib/raygun");

// test("add breadcrumbs to payload details", {}, function (t) {
//   let client = new Raygun.Client().init({ apiKey: "TEST" });
//
//   client.addBreadcrumb("BREADCRUMB-1");
//   client.addBreadcrumb("BREADCRUMB-2");
//
//   client.onBeforeSend(function (payload) {
//     t.equal(payload.details.breadcrumbs.length, 2);
//     t.equal(payload.details.breadcrumbs[0].message, "BREADCRUMB-1");
//     t.equal(payload.details.breadcrumbs[1].message, "BREADCRUMB-2");
//     return payload;
//   });
//
//   client
//     .send(new Error())
//     .then((message) => {
//       t.end();
//     })
//     .catch((err) => {
//       t.fail(err);
//     });
// });

test("capturing breadcrumbs", async function (t) {
  const app = express();
  const testEnv = await makeClientWithMockServer();
  const raygun = testEnv.client;

  // Must be defined before any endpoint is configured
  app.use(raygun.expressHandlerBreadcrumbs);

  function requestHandler(req, res) {
    raygun.addBreadcrumb("first!");
    setTimeout(() => {
      raygun.addBreadcrumb("second!");
      raygun.send(new Error("test end"));
      res.send("done!");
    }, 1);
  }

  app.get("/", requestHandler);

  const server = await listen(app);

  await request(`http://localhost:${server.address().port}`);
  const message = await testEnv.nextRequest();

  server.close();
  testEnv.stop();

  deepEqual(
    message.details.breadcrumbs.map((b) => b.message),
    ["GET /", "first!", "second!"],
  );

  deepEqual(
    message.details.breadcrumbs.map((b) => b.methodName),
    [undefined, requestHandler.name, "<anonymous>"],
  );

  deepEqual(
    message.details.breadcrumbs.map((b) => b.className),
    [undefined, __filename, __filename],
  );

  // line numbers correspond to the calls to `addBreadcrumb` in this test
  // update accordingly if they change
  deepEqual(
    message.details.breadcrumbs.map((b) => b.lineNumber),
    [undefined, 39, 41],
  );

  t.end();
});

test("capturing breadcrumbs in different contexts", async function (t) {
  const app = express();
  const testEnv = await makeClientWithMockServer();
  const raygun = testEnv.client;

  // Must be defined before any endpoint is configured
  app.use(raygun.expressHandlerBreadcrumbs);

  app.get("/endpoint1", (req, res) => {
    raygun.addBreadcrumb("endpoint1: 1");
    setTimeout(() => {
      raygun.addBreadcrumb("endpoint1: 2");
      raygun.send(new Error("error1"));
      res.send("done!");
    }, 1);
  });

  app.get("/endpoint2", (req, res) => {
    raygun.addBreadcrumb("endpoint2: 1");
    setTimeout(() => {
      raygun.addBreadcrumb("endpoint2: 2");
      raygun.send(new Error("error2"));
      res.send("done!");
    }, 1);
  });

  const server = await listen(app);

  await request(`http://localhost:${server.address().port}/endpoint1`);
  const message1 = await testEnv.nextRequest();

  await request(`http://localhost:${server.address().port}/endpoint2`);
  const message2 = await testEnv.nextRequest();

  server.close();
  testEnv.stop();

  deepEqual(
      message1.details.breadcrumbs.map((b) => b.message),
      ["GET /endpoint1", "endpoint1: 1", "endpoint1: 2"],
  );

  deepEqual(
      message2.details.breadcrumbs.map((b) => b.message),
      ["GET /endpoint2", "endpoint2: 1", "endpoint2: 2"],
  );

  t.end();
});

test("expressHandler and breadcrumbs", async function (t) {
  const app = express();

  const testEnvironment = await makeClientWithMockServer();
  const raygunClient = testEnvironment.client;

  // Must be defined before any endpoint is configured
  app.use(raygunClient.expressHandlerBreadcrumbs);

  // This breadcrumb is in the global app scope, so it won't be included
  raygunClient.addBreadcrumb("breadcrumb in global scope");

  // Define root endpoint which throws an error
  app.get("/", (req, res) => {

    // Add an extra breadcrumb before throwing
    raygunClient.addBreadcrumb("breadcrumb-1");

    // Throw error, should be captured by the expressHandler
    throw new Error("surprise error!");
  });

  // Add Raygun error express handler
  app.use(raygunClient.expressHandler);

  // Start test server and request root
  const server = await listen(app);
  await request(`http://localhost:${server.address().port}`);
  const message = await testEnvironment.nextRequest();

  server.close();
  testEnvironment.stop();

  // Error captured by expressHandler
  t.ok(
      message.details.tags.includes("UnhandledException")
  );

  // Error should include breadcrumbs from the scoped store
  t.equal(message.details.breadcrumbs.length, 2);
  t.equal(message.details.breadcrumbs[0].message, "GET /");
  t.equal(message.details.breadcrumbs[1].message, "breadcrumb-1");
  t.end();
});
