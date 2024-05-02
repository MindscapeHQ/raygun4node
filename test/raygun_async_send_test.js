"use strict";

var test = require("tap").test;
var semver = require("semver");
var VError = require("verror");
var nock = require("nock");

var Raygun = require("../lib/raygun.ts");

nock(/.*/)
  .post(/.*/, function () {
    return true;
  })
  .reply(202, {})
  .persist();
var API_KEY = "apikey";

test("async send basic", {}, function (t) {
  t.plan(1);

  if (semver.satisfies(process.version, "=0.10")) {
    t.pass("Ignored on node 0.10");
    t.end();
    return;
  }

  let client = new Raygun.Client().init({
    apiKey: API_KEY,
  });
  client.send(new Error()).then((response) => {
    t.equal(response.statusCode, 202);
    t.end();
  }).catch((err) => {
    t.fail(err);
  });
});

test("async send complex", {}, function (t) {
  t.plan(1);

  if (semver.satisfies(process.version, "=0.10")) {
    t.pass("Ignored on node 0.10");
    t.end();
    return;
  }

  let client = new Raygun.Client()
    .init({ apiKey: API_KEY })
    .setUser("callum@mindscape.co.nz")
    .setVersion("1.0.0.0");

  client.send(new Error()).then((response) => {
    t.equal(response.statusCode, 202);
    t.end();
  }).catch((err) => {
    t.fail(err);
  });
});

test("async send with inner error", {}, function (t) {
  t.plan(1);

  if (semver.satisfies(process.version, "=0.10")) {
    t.pass("Ignored on node 0.10");
    t.end();
    return;
  }

  let error = new Error("Outer");
  let innerError = new Error("Inner");

  error.cause = function () {
    return innerError;
  };

  let client = new Raygun.Client().init({
    apiKey: API_KEY,
  });
  client.send(new Error()).then((response) => {
    t.equal(response.statusCode, 202);
    t.end();
  }).catch((err) => {
    t.fail(err);
  });
});

test("async send with verror", {}, function (t) {
  t.plan(1);

  if (semver.satisfies(process.version, "=0.10")) {
    t.pass("Ignored on node 0.10");
    t.end();
    return;
  }

  let error = new VError(
    new VError(new VError("Deep Error"), "Inner Error"),
    "Outer Error",
  );

  let client = new Raygun.Client().init({
    apiKey: API_KEY,
  });
  client.send(error).then((response) => {
    t.equal(response.statusCode, 202);
    t.end();
  }).catch((err) => {
    t.fail(err);
  });
});

test("async send with OnBeforeSend", {}, function (t) {
  t.plan(1);

  if (semver.satisfies(process.version, "=0.10")) {
    t.pass("Ignored on node 0.10");
    t.end();
    return;
  }

  let client = new Raygun.Client().init({
    apiKey: API_KEY,
  });

  let onBeforeSendCalled = false;
  client.onBeforeSend(function (payload) {
    onBeforeSendCalled = true;
    return payload;
  });

  client.send(new Error()).then((response) => {
    t.equal(onBeforeSendCalled, true);
    t.end();
  }).catch((err) => {
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

  client.sendWithCallback(new Error(), {}, function () {
    t.end();
  });
});

test("check that tags get merged", {}, function (t) {
  let client = new Raygun.Client().init({ apiKey: "TEST" });
  client.setTags(["Tag1"]);

  client.onBeforeSend(function (payload) {
    t.same(payload.details.tags, ["Tag1", "Tag2"]);
    return payload;
  });

  client.send(
    new Error(),
    {},
    null,
    ["Tag2"],
  ).then((message) => {
    t.end();
  }).catch((err) => {
    t.fail(err);
  });
});
