var config = require("config");

if (config.Raygun.Key === "YOUR_API_KEY") {
  console.error(
    "[Raygun4Node-Domains-Sample] You need to set your Raygun API key in the config file",
  );
  process.exit(1);
}

// Setup Raygun
var raygun = require("raygun");
var raygunClient = new raygun.Client().init({ apiKey: config.Raygun.Key });

// Setup APM Bridge
raygunClient.setApmBridge(require("raygun-apm/lib/src/crash_reporting"));

// Send Raygun error
raygunClient
  .send("Sending error with APM bridge")
  .then((message) => {
    console.log(`Sent message: ${message.statusCode}`);
  })
  .catch((error) => {
    console.error(`Failed to send message: ${error}`);
  });
