const express = require("express");
const router = express.Router();
const raygunClient = require("../raygun.client");

/* GET home page. */
router.get("/", function (req, res, next) {
  console.debug("Call /index");
  res.render("index", {
    title: "Raygun Express Example",
  });
});

router.get("/skip", function (req, res, next) {
  console.debug("Call /skip");
  raygunClient
    .send("Error to skip")
    .then((message) => {
      console.debug(`Called raygunClient.send, response: ${message.statusCode}`);
      res.render("send", {
        title: "Skip sending message",
        body: `Message should be null: ${message}`,
      });
    })
    .catch((error) => {
      console.error(`Got Error: ${error.message}`);
      res.render("send", {
        title: "Failed to send error to Raygun",
        body: error.toString(),
      });
    });
});

router.get("/send", function (req, res, next) {
  console.debug("Call /send");
  raygunClient.addBreadcrumb({
    level: "debug",
    category: "Example",
    message: "Breadcrumb in /send endpoint",
    customData: {
      "custom-data": "data",
    },
  });

  raygunClient
    .send("Custom Raygun Error in /send endpoint", { tags: ["request"] })
    .then((message) => {
      console.debug(`Called raygunClient.send, response: ${message.statusCode}`);
      res.render("send", {
        title: "Sent custom error to Raygun",
        body: `Raygun status code: ${message.statusCode}`,
      });
    })
    .catch((error) => {
      console.error(`Got Error: ${error.message}`);
      res.render("send", {
        title: "Failed to send custom error to Raygun",
        body: error.toString(),
      });
    });
});

router.get("/error", function (req, res, next) {
  console.debug("Call /error");
  raygunClient.addBreadcrumb({
    level: "debug",
    category: "Example",
    message: "Breadcrumb in /error endpoint",
    customData: {
      "custom-data": "data",
    },
  });

  // Call an object that doesn't exist to send an error to Raygun
  fakeObject.FakeMethod();
  res.send(500);
});

module.exports = router;
