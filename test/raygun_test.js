"use strict";

var test = require("tap").test;
var Raygun = require("../lib/raygun.ts");

var options = {
  apiKey: process.env.RAYGUN_APIKEY,
};

test("init", function (t) {
  t.ok(new Raygun.Client().init(options));
  t.end();
});

test("user", function (t) {
  var client = new Raygun.Client().init(options);

  client.user = function (req) {
    return req.user;
  };

  var req = {
    user: "theuser",
  };

  t.equal(client.user(req), "theuser");
  t.end();
});

test("request filters and onBeforeSend protect separate report sections", async (t) => {
  const { makeClientWithMockServer } = require("./utils");
  const secret = "private-data-sentinel";
  let hookCalled = false;
  const environment = await makeClientWithMockServer({
    filters: ["authorization", "cookie", "password"],
    onBeforeSend: (payload) => {
      hookCalled = true;
      t.same(payload.details.request.headers, { accept: "application/json" });
      t.same(payload.details.request.queryString, { page: "2" });
      t.same(payload.details.request.form, { nested: { safe: "retained" } });
      t.equal(payload.details.userCustomData.password, secret);
      t.equal(payload.details.breadcrumbs[0].customData.password, secret);
      delete payload.details.userCustomData;
      delete payload.details.breadcrumbs;
      return payload;
    },
  });
  t.teardown(() => environment.stop());
  environment.client.addBreadcrumb({
    message: "operation started",
    customData: { password: secret },
  });
  const nextRequest = environment.nextRequest();
  await environment.client.send(new Error("operation failed"), {
    customData: { password: secret },
    request: {
      headers: {
        authorization: secret,
        cookie: secret,
        accept: "application/json",
      },
      query: { password: secret, page: "2" },
      body: { nested: { password: secret, safe: "retained" } },
    },
  });
  const message = await nextRequest;
  t.ok(hookCalled);
  t.same(message.details.request.form, { nested: { safe: "retained" } });
  t.notOk("userCustomData" in message.details);
  t.notOk("breadcrumbs" in message.details);
  t.notMatch(JSON.stringify(message), secret);
});
