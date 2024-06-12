const util = require("util");
var childProcess = require("child_process");

var test = require("tap").test;

var { makeClientWithMockServer } = require("./utils");
const { deepEqual } = require("node:assert");

test("reporting uncaught exceptions", async function (t) {
  const testEnvironment = await makeClientWithMockServer();
  const messagePromise = testEnvironment.nextRequest();

  // Launch raygun_unhandled_rejection_app.js which has an unhandled Promise rejection
  // and should be caught by the Raygun client automatically,
  // then the error report is available in the messagePromise.
  await util
    .promisify(childProcess.exec)(
      "node -r ts-node/register ./raygun_unhandled_rejection_app.js",
      {
        cwd: __dirname,
        stdio: "inherit",
        env: {
          ...process.env,
          RAYGUN_API_KEY: "test",
          RAYGUN_API_PORT: testEnvironment.address.port,
        },
      },
    )
    .catch(() => {});

  // Captured error report is available
  const message = await messagePromise;

  testEnvironment.stop();

  t.equal(message.details.error.message, "test");
  // Ensure that the error was reported by the unhandledRejection listener
  deepEqual(message.details.tags, ["unhandledRejection"]);
  t.end();
});
