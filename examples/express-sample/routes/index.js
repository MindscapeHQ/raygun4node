const express = require("express");
const router = express.Router();
const raygunClient = require("../raygun.client");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", {
    title: "Raygun Express Example",
  });
});

router.get("/send", function (req, res, next) {
  raygunClient.addBreadcrumb({
    level: "debug",
    category: "Example",
    message: "Breadcrumb in /send endpoint",
    customData: {
      "custom-data": "data",
    },
  });

  raygunClient
    .send("Error in /send endpoint")
    .then((message) => {
      res.render("send", {
        title: "Sent custom error to Raygun",
        body: `Raygun status code: ${message.statusCode}`,
      });
    })
    .catch((error) => {
      res.render("send", {
        title: "Failed to send custom error to Raygun",
        body: error.toString(),
      });
    });
});

router.get("/error", function (req, res, next) {
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
