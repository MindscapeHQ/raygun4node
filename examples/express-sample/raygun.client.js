var config = require("config");

if (config.Raygun.Key === "YOUR_API_KEY") {
  console.error(
    "[Raygun4Node-Express-Sample] You need to set your Raygun API key in the config file",
  );
  process.exit(1);
}

// Setup Raygun
var raygun = require("raygun");
var raygunClient = new raygun.Client().init({
  apiKey: config.Raygun.Key,
  useHumanStringForObject: true,
});

module.exports = raygunClient;
