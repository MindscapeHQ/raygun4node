const Raygun = require("../lib/raygun");
const express = require("express");

function makeClientWithMockServer(clientOptions = {}) {
  return new Promise((resolve, reject) => {
    const server = express();

    const entries = [];
    const bulkEntries = [];
    let messageCallback = null;

    server.use(express.json());
    server.post("/entries", (req, res) => {
      const body = req.body;
      entries.push(body);

      if (messageCallback) {
        messageCallback(body);
        messageCallback = null;
      }

      res.send("");
    });

    server.post("/entries/bulk", (req, res) => {
      bulkEntries.push(JSON.parse(req.body));
      res.send("");
    });

    const listener = server.listen(0, "localhost", () => {
      const address = listener.address();
      const client = new Raygun.Client().init({
        apiKey: "TEST_API_KEY",
        host: "localhost",
        port: address.port,
        useSSL: false,
      });

      resolve({
        client,
        server: { entries, bulkEntries },
        stop: () => listener.close(() => console.log("test env stopped")),
        nextRequest: () =>
          new Promise((resolve, reject) => {
            messageCallback = resolve;
          }),
      });
    });
  });
}

module.exports = {
  makeClientWithMockServer,
};
