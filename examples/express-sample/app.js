var express = require("express");
var path = require("path");
var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var sassMiddleware = require("node-sass-middleware");
var raygunClient = require("./raygun.client");

var routes = require("./routes/index");
var users = require("./routes/users");

var app = express();

// Set the user if we have one
raygunClient.user = function (req) {
  return "user@example.com";
};

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Add the Raygun breadcrumb Express handler
app.use(raygunClient.expressHandlerBreadcrumbs);

app.use(favicon(__dirname + "/public/favicon.ico"));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  }),
);
app.use(cookieParser());
app.use(
  sassMiddleware({
    src: __dirname,
    dest: path.join(__dirname, "public"),
    debug: true,
    outputStyle: "compressed",
    prefix: "/stylesheets",
  }),
);
app.use(express.static(path.join(__dirname, "public")));

app.use("/", routes);
app.use("/users", users);

// Add the Raygun error Express handler
app.use(raygunClient.expressHandler);

// Optional: Configure onBeforeSend
raygunClient.onBeforeSend((message, exception, customData, request, tags) => {
  console.log(
    `[app.js] onBeforeSend called with error: ${message.details.error.message}`,
  );

  // If the message contains the word "skip", do not send the message to Raygun
  if (message.details.error.message.indexOf("skip") > -1) {
    console.log("[app.js] skip sending message");
    return null;
  }

  return message;
});

raygunClient.addBreadcrumb("Express Server started!");

module.exports = app;
