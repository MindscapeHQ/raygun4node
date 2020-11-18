const express = require("express");
const test = require("tap").test;
const { runWithBreadcrumbs } = require("../lib/raygun");
const { listen, makeClientWithMockServer, request } = require("./utils");

test("capturing breadcrumbs", async function (t) {
  const app = express();
  const testEnv = await makeClientWithMockServer();
  const raygun = testEnv.client;

  app.use((req, res, next) => {
    runWithBreadcrumbs(next);
  });

  app.get("/", (req, res) => {
    raygun.addBreadcrumb("first!");
    setTimeout(() => {
      raygun.addBreadcrumb("second!");
      raygun.send(new Error("test end"));
      res.send("done!");
    }, 1);
  });

  const server = await listen(app);

  await request(`http://localhost:${server.address().port}`);
  const message = await testEnv.nextRequest();

  server.close();
  testEnv.stop();

  t.assert(
    message.details.breadcrumbs.map((b) => b.message),
    ["first!", "second!"]
  );
  t.pass();
});