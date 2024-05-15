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
    .setUser("callum@mindscape.co.nz")
    .setVersion("1.0.0.0");

  client
    .send({ exception: new Error() })
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
    .send({ exception: new Error() })
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
    .send({ exception: error })
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
