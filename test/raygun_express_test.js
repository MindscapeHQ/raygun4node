var express = require("express");
var http = require("http");
var test = require("tap").test;

var { makeClientWithMockServer } = require("./utils");

var API_KEY = "apikey";

function request(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, (res) => {
      res.on("end", resolve);
      res.resume();
    });

    req.on("error", reject);
    req.write("");
    req.end();
    req.shouldKeepAlive = false;
  });
}

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "localhost", () => {
      resolve(server);
    });
  });
}

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
