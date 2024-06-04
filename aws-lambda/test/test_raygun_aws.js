const test = require("tap").test;
const { makeClientWithMockServer } = require("../../test/utils");
const { awsHandler } = require("../lib/raygun.aws");

test("capture AWS lambda errors", async function (t) {
  // Setup client
  const testEnvironment = await makeClientWithMockServer();
  const client = testEnvironment.client;

  // Setup lambda that crashes
  const lambda = awsHandler({ client }, async (event, context) => {
    throw "error";
  });

  const nextRequest = testEnvironment.nextRequest();

  try {
    // Call to lambda
    await lambda({ event: "event" }, { functionName: "test" });
  } catch (e) {
    // error should be re-thrown to AWS
    t.equal(e, "error");
  }

  const message = await nextRequest;

  testEnvironment.stop();

  t.equal(message.details.error.message, "error");
});
