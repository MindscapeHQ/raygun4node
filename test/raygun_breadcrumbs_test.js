const express = require("express");
const deepEqual = require("assert").deepEqual;
const test = require("tap").test;
const { listen, makeClientWithMockServer, request } = require("./utils");
const Raygun = require("../lib/raygun");

test("add breadcrumbs to payload details", {}, function (t) {
  let client = new Raygun.Client().init({ apiKey: "TEST" });

  client.addBreadcrumb("BREADCRUMB-1");
  client.addBreadcrumb("BREADCRUMB-2");

  client.onBeforeSend(function (payload) {
    t.equal(payload.details.breadcrumbs.length, 2);
    t.equal(payload.details.breadcrumbs[0].message, "BREADCRUMB-1");
    t.equal(payload.details.breadcrumbs[1].message, "BREADCRUMB-2");
    return payload;
  });

  client
    .send(new Error())
    .then((message) => {
      t.end();
    })
    .catch((err) => {
      t.fail(err);
    });
});

test("capturing breadcrumbs", async function (t) {
  const app = express();
  const testEnv = await makeClientWithMockServer();
  const raygun = testEnv.client;

  app.use(raygun.breadcrumbs);

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
  t.equal(
    message.details.breadcrumbs.map((b) => b.lineNumber),
    [undefined, 38, 40],
  );
});
