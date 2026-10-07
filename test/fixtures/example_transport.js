const assert = require("node:assert/strict");
const path = require("node:path");
const { Client } = require("../..");
const { fetch } = globalThis;

// Redirect the real sample client before loading the sample. Never contact Raygun.
const init = Client.prototype.init;
Client.prototype.init = function (options) {
  return init.call(this, {
    ...options,
    host: "localhost",
    port: Number(process.env.RAYGUN_TEST_PORT),
    useSSL: false,
  });
};

const app = require(path.resolve("app.js"));

if (process.env.RAYGUN_TEST_EXAMPLE === "express-sample") {
  const client = require(path.resolve("raygun.client.js"));
  const pending = [];
  const send = client.send;
  client.send = (...args) => {
    const result = send(...args);
    pending.push(result);
    return result;
  };

  const server = app.listen(0, "localhost", async () => {
    try {
      const base = `http://localhost:${server.address().port}`;
      const sent = await fetch(`${base}/send`);
      assert.equal(sent.status, 200);
      assert.match(await sent.text(), /Raygun status code: 200/);
      const failed = await fetch(`${base}/error`);
      assert.equal(failed.status, 500);
      await failed.text();
      const skipped = await fetch(`${base}/skip`);
      assert.equal(skipped.status, 200);
      assert.match(await skipped.text(), /Message should be null: null/);
      await Promise.all(pending);
      assert.equal(pending.length, 3);
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    } finally {
      client.stop();
      server.close();
      server.closeAllConnections();
    }
  });
}
