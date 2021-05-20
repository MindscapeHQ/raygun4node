const Raygun = require("../");
const API_KEY = process.env.RAYGUN_API_KEY;
const API_PORT = process.env.RAYGUN_API_PORT;

const raygunClient = new Raygun.Client().init({
  apiKey: API_KEY,
  host: "localhost",
  port: API_PORT,
  useSSL: false,
});

process.on("uncaughtExceptionMonitor", function (e) {
  raygunClient.sendSync(e);
});

throw new Error("test");
