const test = require("tap").test;
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const path = require("node:path");
const { makeClientWithMockServer } = require("./utils");

for (const example of ["express-sample", "using-domains"]) {
  if (
    process.env.RAYGUN_TEST_EXAMPLE &&
    process.env.RAYGUN_TEST_EXAMPLE !== example
  ) {
    continue;
  }
  test(`${example} sends real error reports to a local endpoint`, async (t) => {
    const environment = await makeClientWithMockServer();
    t.teardown(() => environment.stop());
    let exitCode = 0;
    try {
      await promisify(execFile)(
        process.execPath,
        [path.join(__dirname, "fixtures/example_transport.js")],
        {
          cwd: path.join(__dirname, "../examples", example),
          timeout: 10000,
          env: {
            ...process.env,
            NODE_ENV: "production",
            NODE_CONFIG: JSON.stringify({ Raygun: { Key: "TEST_API_KEY" } }),
            RAYGUN_TEST_PORT: String(environment.address.port),
            RAYGUN_TEST_EXAMPLE: example,
          },
        },
      );
    } catch (error) {
      if (example !== "using-domains" || error.code !== 1) throw error;
      t.match(error.stdout, /Error sent to Raygun, exiting process/);
      exitCode = error.code;
    }
    const entries = environment.server.entries;
    if (example === "express-sample") {
      t.equal(exitCode, 0);
      t.equal(entries.length, 2, "skip route does not send a report");
      const [sent, failed] = entries;
      t.equal(
        sent.details.error.message,
        "Custom Raygun Error in /send endpoint",
      );
      t.same(sent.details.tags, ["request"]);
      t.same(sent.details.user, {
        identifier: "123456",
        email: "custom@example.com",
      });
      t.same(
        sent.details.breadcrumbs.map((crumb) => crumb.message),
        ["GET /send", "Breadcrumb in /send endpoint"],
      );
      t.equal(failed.details.error.message, "fakeObject is not defined");
      t.same(failed.details.tags, ["UnhandledException"]);
      t.equal(failed.details.request.url, "/error");
      t.same(
        failed.details.breadcrumbs.map((crumb) => crumb.message),
        ["GET /error", "Breadcrumb in /error endpoint"],
      );
    } else {
      t.equal(exitCode, 1, "sample exits after its intentional error");
      t.equal(entries.length, 1);
      t.equal(
        entries[0].details.error.message,
        "fakeErrorHandler is not defined",
      );
      t.same(
        entries[0].details.breadcrumbs.map((crumb) => crumb.message),
        ["Running example app", "Domain error caught!"],
      );
    }
  });
}
