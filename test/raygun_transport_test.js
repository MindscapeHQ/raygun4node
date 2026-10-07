"use strict";

const test = require("tap").test;
const http = require("http");
const { EventEmitter } = require("events");
const debug = require("debug");
const { send, sendBatch } = require("../lib/raygun.transport");

for (const outcome of ["success", "error", "timeout", "invalid payload"]) {
  test(`transport logs omit sensitive data on ${outcome}`, async (t) => {
    const logs = [];
    const originalError = console.error;
    const originalLog = debug.log;
    const originalRequest = http.request;
    const namespaces = debug.disable();
    debug.enable("raygun");
    console.error = (...args) => logs.push(args.join(" "));
    debug.log = (...args) => logs.push(args.join(" "));
    t.teardown(() => {
      console.error = originalError;
      debug.log = originalLog;
      http.request = originalRequest;
      debug.enable(namespaces);
    });

    const secret = "private-report-sentinel";
    const message = JSON.stringify({ password: secret });
    const transportError = new Error(`remote error containing ${secret}`);
    const response = { statusCode: 202 };
    let timeoutCallback;
    let written;
    let destroyed = false;
    http.request = (options, callback) => {
      t.equal(options.headers["X-ApiKey"], "private-api-key");
      const request = new EventEmitter();
      request.write = (data) => {
        written = data.toString();
      };
      request.setTimeout = (timeout, handler) => {
        t.equal(timeout, 50);
        timeoutCallback = handler;
      };
      request.destroy = (error) => {
        destroyed = true;
        if (error) request.emit("error", error);
      };
      request.end = () => {
        if (outcome === "success") callback(response);
        if (outcome === "error") request.emit("error", transportError);
        if (outcome === "timeout") timeoutCallback();
      };
      return request;
    };

    for (const transport of [send, sendBatch]) {
      const result = transport({
        message: outcome === "invalid payload" ? undefined : message,
        http: { apiKey: "private-api-key", timeout: 50, useSSL: false },
      });
      if (outcome === "success") {
        t.equal(await result, response);
        t.ok(destroyed);
      } else if (outcome === "error") {
        try {
          await result;
          t.fail("transport must reject");
        } catch (error) {
          t.equal(
            error,
            transportError,
            "caller still receives original error",
          );
        }
      } else {
        await t.rejects(
          result,
          outcome === "timeout" ? /Request timed out/ : TypeError,
        );
      }
      if (outcome !== "invalid payload") t.equal(written, message);
    }

    t.ok(logs.length, "transport emits diagnostics");
    t.notMatch(logs.join("\n"), secret);
    t.notMatch(logs.join("\n"), "private-api-key");
  });
}

test("oversized batches do not expose report contents in logs or errors", (t) => {
  const {
    RaygunBatchTransport,
    MAX_BATCH_SIZE_BYTES,
  } = require("../lib/raygun.batch");
  const logs = [];
  const originalError = console.error;
  console.error = (...args) => logs.push(args.join(" "));
  t.teardown(() => {
    console.error = originalError;
  });
  const transport = new RaygunBatchTransport({
    interval: 1000,
    httpOptions: {},
  });
  t.teardown(() => transport.stopProcessing());
  const secret = "oversized-private-sentinel";
  try {
    transport.send({ message: secret + "x".repeat(MAX_BATCH_SIZE_BYTES) });
    t.fail("oversized report must be rejected");
  } catch (error) {
    t.match(error.message, /Error is too large to send to Raygun/);
    t.notMatch(error.message, secret);
  }
  t.ok(logs.length);
  t.notMatch(logs.join("\n"), secret);
  t.end();
});
