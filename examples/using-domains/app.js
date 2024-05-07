var config = require("config");

if (config.Raygun.Key === "YOUR_API_KEY") {
  console.error(
    `[Raygun4Node-Domains-Sample] You need to set your Raygun API key in the config file`,
  );
  process.exit(1);
}

// Setup Raygun
var raygun = require("raygun");
var raygunClient = new raygun.Client().init({ apiKey: config.Raygun.Key });

// Create a domain
var appDomain = require("domain").create();

// Add the error handler so we can pass errors to Raygun when the domain
// crashes
appDomain.on("error", function (err) {
  console.log(`[Raygun4Node-Domains-Sample] Domain error caught: ${err}`);
  // Try send data to Raygun
  raygunClient
    .send(err)
    .then((message) => {
      // Exit the process once the error has been sent
      console.log(
        `[Raygun4Node-Domains-Sample] Error sent to Raygun, exiting process`,
      );
      process.exit(1);
    })
    .catch((error) => {
      // If there was an error sending to Raygun, log it out and end the process.
      // Could possibly log out to a text file here
      console.log(error);
      process.exit(1);
    });
});

// Run the domain
appDomain.run(function () {
  var fs = require("fs");

  console.log(`[Raygun4Node-Domains-Sample] Running example app`);

  // Try and read a file that doesn't exist
  fs.readFile("badfile.json", "utf8", function (err, file) {
    if (err) {
      // We could send the error straight to Raygun
      // raygunClient.send(err);

      // Or we can deal with it in our "Fake Error Handler" below

      // This will throw an error as fakeErrorHandler doesn't exist
      // eslint-disable-next-line
      fakeErrorHandler.DealWith(err);
    }
  });
});
