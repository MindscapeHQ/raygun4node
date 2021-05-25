const util = require("util");
var childProcess = require("child_process");

var test = require("tap").test;

var { makeClientWithMockServer } = require("./utils");

test("reporting uncaught exceptions", async function (t) {
  const testEnvironment = await makeClientWithMockServer();
  const messagePromise = testEnvironment.nextRequest();

  await util
    .promisify(childProcess.exec)(
      `node -r ts-node/register ./raygun_uncaught_exception_app.js`,
      {
        cwd: __dirname,
        stdio: "inherit",
        env: {
          ...process.env,
          RAYGUN_API_KEY: "test",
          RAYGUN_API_PORT: testEnvironment.address.port,
        },
      }
    )
    .catch(() => {});

  const message = await messagePromise;

  testEnvironment.stop();

  t.equal(message.details.error.message, "test");
  t.end();
});
