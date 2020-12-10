const express = require("express");
const test = require("tap").test;
const { listen, makeClientWithMockServer, request } = require("./utils");

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

  t.deepEquals(
    message.details.breadcrumbs.map((b) => b.message),
    ["GET /", "first!", "second!"]
  );

  t.deepEquals(
    message.details.breadcrumbs.map((b) => b.methodName),
    [undefined, requestHandler.name, "<anonymous>"]
  );

  t.deepEquals(
    message.details.breadcrumbs.map((b) => b.className),
    [undefined, __filename, __filename]
  );

  t.deepEquals(
    message.details.breadcrumbs.map((b) => b.lineNumber),
    [undefined, 13, 15]
  );
});
