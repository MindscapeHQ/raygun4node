const fs = require("fs");
const os = require("os");
const path = require("path");
const { promisify } = require("util");

const test = require("tap").test;

const { makeClientWithMockServer } = require("./utils");

test("offline message storage and sending", async function (t) {
  const cachePath = fs.mkdtempSync(path.join(os.tmpdir(), "raygun4node-test"));

  const testEnvironment = await makeClientWithMockServer({
    isOffline: true,
    offlineStorageOptions: {
      cachePath,
    },
  });
  const raygunClient = testEnvironment.client;
  await raygunClient.send(new Error("offline error"));

  const files = fs.readdirSync(cachePath);

  t.equal(
    files.length,
    1,
    `Expected to find 1 error file but instead found ${files.length}`,
  );

  const file = files[0];
  const contents = fs.readFileSync(path.join(cachePath, file), "utf-8");
  const data = JSON.parse(contents);

  t.equal(data.details.error.message, "offline error");

  await raygunClient.send(new Error("offline error 2"));

  await promisify(raygunClient.online.bind(raygunClient))();
  await testEnvironment.nextRequest();
  await testEnvironment.nextRequest();

  const filesAfterSend = fs.readdirSync(cachePath);

  t.equal(
    filesAfterSend.length,
    0,
    `Expected to find no stored error files but instead found ${filesAfterSend.length}`,
  );

  testEnvironment.stop();
  fs.rmdirSync(cachePath);
});

test("batched offline message storage and sending", async function (t) {
  const cachePath = fs.mkdtempSync(path.join(os.tmpdir(), "raygun4node-test"));

  const testEnvironment = await makeClientWithMockServer({
    batch: true,
    isOffline: true,
    offlineStorageOptions: {
      cachePath,
    },
  });
  const raygunClient = testEnvironment.client;
  await raygunClient.send(new Error("offline error"));

  const files = fs.readdirSync(cachePath);

  t.equal(
    files.length,
    1,
    `Expected to find 1 error file but instead found ${files.length}`,
  );

  const file = files[0];
  const contents = fs.readFileSync(path.join(cachePath, file), "utf-8");
  const data = JSON.parse(contents);

  t.equal(data.details.error.message, "offline error");

  await raygunClient.send(new Error("offline error 2"));

  await promisify(raygunClient.online.bind(raygunClient))();
  const batch = await testEnvironment.nextBatchRequest();

  const filesAfterSend = fs.readdirSync(cachePath);

  t.equal(
    filesAfterSend.length,
    0,
    `Expected to find no stored error files but instead found ${filesAfterSend.length}`,
  );

  t.same(batch.map(e => e.details.error.message).sort(), [
    "offline error",
    "offline error 2",
  ]);

  testEnvironment.stop();
  fs.rmdirSync(cachePath);
});
