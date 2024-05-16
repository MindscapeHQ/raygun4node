"use strict";

const test = require("tap").test;
const nock = require("nock");
const Raygun = require("../lib/raygun.ts");

nock(/.*/)
  .post(/.*/, function () {
    return true;
  })
  .reply(202, {})
  .persist();
const API_KEY = "apikey";

test("should call to APM Bridge Notify", {}, function (t) {
  t.plan(3);

  let client = new Raygun.Client().init({
    apiKey: API_KEY,
  });

  const error = new Error();

  client.setApmBridge({
    notify(e, correlationId) {
      // Provide error
      t.equal(e, error);
      // Provide a non-empty Correlation ID
      t.ok(correlationId);
    },
  });

  client
    .send(error)
    .then((response) => {
      t.equal(response.statusCode, 202);
      t.end();
    })
    .catch((err) => {
      t.fail(err);
    });
});
