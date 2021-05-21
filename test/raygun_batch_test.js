const { test } = require("tap");

const {
  prepareBatch,
  MAX_BATCH_SIZE_BYTES,
} = require("../lib/raygun.batch.ts");

test("batch transport prepares valid json", (t) => {
  let a, b, c;

  const messages = [
    { serializedMessage: JSON.stringify((a = { value: 1 })), callback: null },
    { serializedMessage: JSON.stringify((b = { value: [] })), callback: null },
    {
      serializedMessage: JSON.stringify((c = { value: { nested: true } })),
      callback: null,
    },
  ];

  const { payload, messageCount, callbacks } = prepareBatch(messages);

  t.same(JSON.parse(payload), [a, b, c]);

  t.end();
});

test("batch transport includes no more than 100 messages", (t) => {
  const message = JSON.stringify({ a: 1 });
  const messages = [];

  for (let i = 0; i < 150; i++) {
    messages.push({ serializedMessage: message, callback: null });
  }

  const { payload, messageCount, callbacks } = prepareBatch(messages);

  t.equal(messageCount, 100);
  t.equal(messages.length, 50);

  t.end();
});

test(`batch transport includes no more than ${MAX_BATCH_SIZE_BYTES} bytes`, (t) => {
  const messageSize = Math.ceil(MAX_BATCH_SIZE_BYTES / 10);
  const largeMessage = JSON.stringify({ a: "*".repeat(messageSize - 8) });
  const messages = [];

  for (let i = 0; i < 100; i++) {
    messages.push({ serializedMessage: largeMessage, callback: null });
  }

  const { payload, messageCount, callbacks } = prepareBatch(messages);

  t.assert(payload.length <= MAX_BATCH_SIZE_BYTES);
  t.equal(messageCount, 9);
  t.equal(messages.length, 91);

  t.end();
});
