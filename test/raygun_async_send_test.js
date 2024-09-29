"use strict";

const test = require("tap").test;
const VError = require("verror");
const nock = require("nock");
const Raygun = require("../lib/raygun.ts");

nock(/.*/)
  .post(/.*/, function () {
    return true;
  })
  .reply(202, {})
  .persist();
const API_KEY = "apikey";

test("async send basic", {}, function (t) {
  t.plan(1);

  let client = new Raygun.Client().init({
    apiKey: API_KEY,
  });
  client
    .send(new Error())
    .then((response) => {
      t.equal(response.statusCode, 202);
      t.end();
    })
    .catch((err) => {
      t.fail(err);
    });
});

test("async send complex", {}, function (t) {
  t.plan(1);

  let client = new Raygun.Client()
    .init({ apiKey: API_KEY })
    .setVersion("1.0.0.0");

  client
    .send(new Error())
    .then((response) => {
      t.equal(response.statusCode, 202);
      t.end();
    })
    .catch((err) => {
      t.fail(err);
    });
});

test("async send complex with timeout", {}, function (t) {
  t.plan(1);

  let client = new Raygun.Client()
    .init({ apiKey: API_KEY, timeout: 5000 })
    .setVersion("1.0.0.0");

  client
    .send(new Error())
    .then((response) => {
      t.equal(response.statusCode, 202);
      t.end();
    })
    .catch((err) => {
      t.fail(err);
    });
});

test("async send with inner error", {}, function (t) {
  t.plan(1);

  let error = new Error("Outer");
  let innerError = new Error("Inner");

  error.cause = function () {
    return innerError;
  };

  let client = new Raygun.Client().init({
    apiKey: API_KEY,
  });
  client
    .send(new Error())
    .then((response) => {
      t.equal(response.statusCode, 202);
      t.end();
    })
    .catch((err) => {
      t.fail(err);
    });
});

test("async send with verror", {}, function (t) {
  t.plan(1);

  let error = new VError(
    new VError(new VError("Deep Error"), "Inner Error"),
    "Outer Error",
  );

  let client = new Raygun.Client().init({
    apiKey: API_KEY,
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

test("async send with OnBeforeSend", {}, function (t) {
  t.plan(1);

  let client = new Raygun.Client().init({
    apiKey: API_KEY,
  });

  let onBeforeSendCalled = false;
  client.onBeforeSend(function (payload) {
    onBeforeSendCalled = true;
    return payload;
  });

  client
    .send(new Error())
    .then((response) => {
      t.equal(onBeforeSendCalled, true);
      t.end();
    })
    .catch((err) => {
      t.fail(err);
    });
});

test("onBeforeSend returns null, cancel send", {}, function (t) {
  t.plan(2);

  let client = new Raygun.Client().init({
    apiKey: API_KEY,
  });

  client.onBeforeSend(function (payload) {
    // onBeforeSend is called and the payload is valid
    t.ok(payload);
    // Returning null cancels send action
    return null;
  });

  client
    .send(new Error())
    .then((response) => {
      // Send finishes, response is null
      t.equal(response, null);
      t.end();
    })
    .catch((err) => {
      t.fail(err);
    });
});

test("check that tags get passed through in async send", {}, function (t) {
  let tag = ["Test"];
  let client = new Raygun.Client().init({ apiKey: "TEST" });

  client.setTags(tag);

  client.onBeforeSend(function (payload) {
    t.same(payload.details.tags, tag);
    return payload;
  });

  client
    .send(new Error())
    .then((message) => {
      t.end();
    })
    .catch((err) => {
      t.fail(err);
    });
});

test("check that tags get merged", {}, function (t) {
  let client = new Raygun.Client().init({ apiKey: "TEST" });
  client.setTags(["Tag1"]);

  client.onBeforeSend(function (payload) {
    t.same(payload.details.tags, ["Tag1", "Tag2"]);
    return payload;
  });

  client
    .send(new Error(), { tags: ["Tag2"] })
    .then((message) => {
      t.end();
    })
    .catch((err) => {
      t.fail(err);
    });
});

test("send with expressHandler custom data", function (t) {
  t.plan(1);
  let client = new Raygun.Client().init({
    apiKey: API_KEY,
  });

  client.expressCustomData = function () {
    return { test: "data" };
  };
  client._send = client.send;
  client.send = (exception, { customData, request, tags }) => {
    client.send = client._send;
    t.equal(customData.test, "data");
    t.end();
    return Promise.resolve(null);
  };
  client.expressHandler(new Error(), {}, {}, function () {});
});

test("provide custom timestamp as date to send", {}, function (t) {
  let client = new Raygun.Client().init({ apiKey: "TEST" });
  const timestamp = new Date(2024, 1, 2, 3, 45, 12, 345);

  client.onBeforeSend(function (payload) {
    t.same(payload.occurredOn, timestamp);
    return payload;
  });

  client
    .send(new Error(), { timestamp })
    .then((message) => {
      t.end();
    })
    .catch((err) => {
      t.fail(err);
    });
});

test("provide custom timestamp as number to send", {}, function (t) {
  let client = new Raygun.Client().init({ apiKey: "TEST" });
  const date = new Date(2024, 1, 2, 3, 45, 12, 345);
  const timestamp = date.getTime();

  client.onBeforeSend(function (payload) {
    t.same(payload.occurredOn, date);
    return payload;
  });

  client
    .send(new Error(), { timestamp })
    .then((message) => {
      t.end();
    })
    .catch((err) => {
      t.fail(err);
    });
});
