# Raygun4Node

[![GitHub CI](https://github.com/MindscapeHQ/raygun4node/actions/workflows/node.js.yml/badge.svg)](https://github.com/MindscapeHQ/raygun4node/actions)

Raygun.com package for Node, written in TypeScript.

# Where is my app API key?

When sending exceptions to the Raygun service, an app API key is required to map the messages to your application.

When you create a new application in your Raygun dashboard, your app API key is displayed within the instructions page. You can also find the API key by clicking the "Application Settings" button in the side bar of the Raygun dashboard.


## Getting Started
Install the module with: `npm install raygun`

```javascript
const raygun = require('raygun');

const raygunClient = new raygun.Client().init({
  apiKey: 'YOUR_API_KEY'
});
```

You can also use `import`, which is useful for loading TypeScript definitions. In order to load type definitions, you can use `import * as Raygun from 'raygun'`, or import the `Client` class directly from the module.

```typescript
import * as Raygun from 'raygun';

const raygunClient = new Raygun.Client().init({
  apiKey: 'YOUR_API_KEY'
});
```

You can directly send errors to Raygun, either by making the error yourself or passing a caught error.

```javascript
raygunClient.send(new Error('Something impossible happened!'));
```

If you use express, you can report the errors that express catches to Raygun by using the middleware.

```javascript
// Add at the end of the middleware definitions, just above app.listen:
app.use(raygunClient.expressHandler);
```

You can directly catch errors in your application code and report them to Raygun.

```javascript
try {
  // run some code that might throw an error we want to report
} catch (e) {
  raygunClient.send(e);
}
```

A similar example for Node style callbacks:
```javascript
function handleResult(error, result) {
  if (error) {
    raygunClient.send(error);
    return;
  }

  // process result
}
```

If you're working directly with promises, you can pass `raygunClient.send` directly to `.catch`.

```javascript
const axios = require('axios');

axios
  .get('example.com')
  .then(handleResponse)
  .catch(raygunClient.send);
```

### Expressjs 4.0 and above

The [Express documentation](http://expressjs.com/guide/error-handling.html) says `Though not strictly required, by convention you define error-handling middleware last, after other app.use() calls`, but that is incorrect. If the `app.use(raygunClient.expressHandler);` call is not immediately before the `app.listen` call, then errors will not be handled by Raygun.

Note that the Express middleware handler will pick up and transmit any `err` objects that reach it. If the app code itself chooses to handle states that result in 4xx/5xx status codes, these will not result in an error payload sent to Raygun.

## Documentation

### Send

The `send()` function is asynchronous and returns a `Promise` of type `IncomingMessage`.

Note that `IncomingMessage` can be `null` if the request was stored because the application was offline.

`IncomingMessage` is the response from the Raygun API - there's nothing in the body, it's just a status code response. 
If everything went ok, you'll get a 202 response code. 
Otherwise, we throw 401 for incorrect API keys, 403 if you're over your plan limits, or anything in the 500+ range for internal errors.

We use the nodejs http/https library to make the POST to Raygun, you can see more documentation about that callback here: https://nodejs.org/api/http.html#http_http_request_options_callback

You can `await` the call to obtain the result, or use `then/catch`.

#### Using `await`

Use `await` to obtain the `IncomingMessage`, remember to `catch` any possible thrown errors from the `send()` method.

```js
try {
  let message = await client.send(error);
} catch (e) {
  // error sending message
}
```

#### Using `then/catch`

You can also use `then()` to obtain the `IncomingMessage`, as well, use `catch()` to catch any possible thrown errors from the `send()` method.

```js
client.send(error)
  .then((message) => {
    // message sent to Raygun
  })
  .catch((error) => {
      // error sending message
  });
```

### Legacy `sendWithCallback`

```javascript
client.sendWithCallback(new Error(), {}, function (response){ });
```

The client still provides a legacy `send()` method that supports callbacks instead of `Promises`.

**This method is deprecated and will be removed in the future.**

The callback should be a node-style callback: `function(err, response) { /*...*/ }`.
*Note*: If the callback only takes one parameter (`function(response){ /*...*/ }`)
it will only be called when the transmission is successful. This is included for
backwards compatibility; the Node-style callback should be preferred.

### Send Parameters

The `send()` method accepts a series of optional named parameters, defined as follows:

```js
client.send(error, { customData, request, tags });
```

Each one of these parameters is optional.
They are explained in detail the following sections.

### Sending custom data

You can pass custom data in on the Send() function, as the `customData` parameter. For instance (based off the call in test/raygun_test.js):

```javascript
client.send(new Error(), { customData: { 'mykey': 'beta' } });
```

#### Sending custom data with Expressjs

If you're using the `raygunClient.expressHandler`, you can send custom data along by setting `raygunClient.expressCustomData` to a function. The function will get two parameters, the error being thrown, and the request object.

```javascript
const raygunClient = new raygun.Client().init({apiKey: "YOUR_API_KEY"});

raygunClient.expressCustomData = function (err, req) {
  return { 'level': err.level };
};
```

### Sending request data

You can send the request data in the Send() function, as the `request` parameter. For example:

```javascript
client.send(new Error(), { request: request });
```

If you want to filter any of the request data then you can pass in an array of keys to filter when
you init the client. For example:
```javascript
const raygun = require('raygun');
const raygunClient = new raygun.Client().init({ apiKey: 'YOUR_API_KEY', filters: ['password', 'creditcard'] });
```

### Tags

You can add tags to your error in the Send() function, as the `tags` parameter. For example:

```javascript
client.send(new Error(), { tags: ['Custom Tag 1', 'Important Error'] });
```

Tags can also be set globally using setTags

```javascript
client.setTags(['Tag1', 'Tag2']);
```

### Customers

New in 0.4: You can set **raygunClient.user** to a function that returns the user name or email address of the currently logged in user.

An example, using the Passport.js middleware:

```javascript
const raygunClient = new raygun.Client().init({apiKey: "YOUR_API_KEY"});

raygunClient.user = function (req) {
  if (req.user) {
    return {
      identifier: req.user.username,
      email: req.user.email,
      fullName: req.user.fullName,
      firstName: req.user.firstName,
      uuid: req.user.deviceID
    };
  }
}
```

#### raygunClient.user(req)

**Param**: *req*: the current request.
**Returns**: The current user's identifier, or an object that describes the user.

This will be transmitted with each message sent, and a count of affected customers will appear on the dashboard in the error group view. If you return an email address, and the user has associated a Gravatar with it, their picture will be also displayed.

If you return an object, it may have any of the following properties (only identifier is required):

`identifier` is the user identifier. This will be used to uniquely identify the user within Raygun. This is the only required parameter, but is only required if you are using customers tracking.

`isAnonymous` is a bool indicating whether the user is anonymous or actually has a user account. Even if this is set to true, you should still give the user a unique identifier of some kind.

`email` is the user's email address.

`fullName` is the user's full name.

`firstName` is the user's first or preferred name.

`uuid` is the identifier of the device the app is running on. This could be used to correlate user accounts over multiple machines.

Any other properties will be discarded.

**Note:** setUser deprecated in 0.4

Release 0.3 previously had a setUser function that accepted a string or function to specify the user, however it did not accept arguments. This method is considered deprecated and will be removed in the 1.0 release, thus it is advised to update your code to set it with the new *user* function.

### Version tracking

Call setVersion(*string*) on a RaygunClient to set the version of the calling application. This is expected to be of the format x.x.x.x, where x is a positive integer. The version will be visible in the dashboard.

### Inner Errors

Starting from 0.10.0 support for inner errors was added. Provide option `innerErrorFieldName` to specify a field or a function on the error object to use for retrieval of an inner error. Inner errors will be retrieved recursively until there is no more errors. Option `innerErrorFieldName` defaults to `cause` which is used in [VError](https://github.com/joyent/node-verror), therefore `VError` is supported out of the box.

### Reporting uncaught exceptions

You can enable reporting uncaught exceptions to Raygun by setting the `reportUncaughtExceptions` option to `true` when initializing the client.

```js
const {Raygun} = require('raygun');

const raygunClient = new Raygun.Client().init({
  apiKey: 'YOUR_API_KEY',
  reportUncaughtExceptions: true
});
```

This will cause any uncaught exceptions to be sent to Raygun prior to the process exiting.

Please note that this feature requires raygun>=0.13.0 and at least Node v12.17.0 or v13.7.0. This is due to the use of the `uncaughtExceptionMonitor` event, which allows monitoring uncaught exceptions without impacting standard process exit logic.

This feature is preferable to using the `domains` module for this purpose, as `domains` is both deprecated and carries a heavy performance overhead.

### Changing the API endpoint

You can change the endpoint that error messages are sent to by specifying the `host`, `port`, and `useSSL` properties in the `raygunClient.init()` options hash. By default, `host` is `api.raygun.com`, `port` is `443`, and `useSSL` is `true`.

### onBeforeSend

Call `Raygun.onBeforeSend()`, passing in a function which takes up to 5 parameters (see the example below). This callback function will be called immediately before the payload is sent. The first parameter it gets will be the payload that is about to be sent. Thus from your function you can inspect the payload and decide whether or not to send it.

You can also pass this in as an option to `init()` like this: `raygunClient.init({ onBeforeSend: function(payload) { return payload; } });`

From the supplied function, you should return either the payload (intact or mutated as per your needs), or false.

If your function returns a truthy object, Raygun4Node will attempt to send it as supplied. Thus, you can mutate it as per your needs - preferably only the values if you wish to filter out data that is not taken care of by the filters. You can also of course return it as supplied.

If, after inspecting the payload, you wish to discard it and abort the send to Raygun, simply return false.

By example:

```javascript
const myBeforeSend = function (payload, exception, customData, request, tags) {
  console.log(payload); // Modify the payload here if necessary
  return payload; // Return false here to abort the send
}

Raygun.onBeforeSend(myBeforeSend);
```

### Breadcrumbs

Breadcrumbs can be sent to Raygun to provide additional information to look into and debug issues stemming from crash reports.

Breadcrumbs can be created in two ways.

#### Simple string:

Call `client.addBreadcrumb(message)`, where message is just a string:

```js
client.addBreadcrumb('test breadcrumb');
```

#### Using `BreadcrumbMessage`:

Create your own `BreadcrumbMessage` object and send more than just a message with `client.addBreadcrumb(BreadcrumbMessage)`.

The structure of the type `BreadcrumbMessage` is as shown here:

```js
BreadcrumbMessage: {
    level: "debug" | "info" | "warning" | "error";
    category: string;
    message: string;
    customData?: CustomData;
}
```

Breadcrumbs can be cleared with `client.clearBreadcrumbs()`.

#### Breadcrumbs and ExpressJS

Raygun4Node provides a custom ExpressJS middleware that helps to scope Breadcrumbs to a specific request.
As well, this middleware will add a Breadcrumb with information about the performed request.

To set up, add the Raygun Breadcrumbs ExpressJS handler before configuring any endpoints.

```js
// Add the Raygun Breadcrumb ExpressJS handler
app.use(raygunClient.expressHandlerBreadcrumbs);

// Setup the rest of the app, e.g.
app.use("/", routes);
```

This middleware can be used together with the provided ExpressJS error handler `expressHandler`.
The order in which the middlewares are configured is important. `expressHandlerBreadcrumbs` should go first to scope breadcrumbs correctly.

```js
app.use(raygunClient.expressHandlerBreadcrumbs);
app.use(raygunClient.expressHandler);
```

### Batched error transport

You can enable a batched transport mode for the Raygun client by passing `{batch: true}` when initializing.

```javascript
const raygunClient = new raygun.Client().init({
  apiKey: 'YOUR_API_KEY',
  batch: true,
  batchFrequency: 5000 // defaults to 1000ms (every second)
});
```

The batch transport mode will collect errors in a queue and process them asynchronously. Rather than sending each error one at a time as they occur, errors will be batched and sent at regular intervals.

If your application generates and reports large volumes of errors, especially in a short duration, the batch transport mode will perform better and operate with less network overhead.

You can control how often batches are processed and sent by providing a `batchFrequency` option, which is a number in milliseconds.

In a future version the batch transport will likely be enabled by default.

### Offline caching

Raygun can cache errors thrown by your Node application when it's running in 'offline' mode. By default the offline cache is disabled. Raygun4Node doesn't detect network state change, that is up to the application using the library.

Raygun includes an on-disk cache provider out of the box, which required write permissions to the folder you wish to use. You cal also pass in your own cache storage.

##### Getting setup with the default offline provide

When creating your Raygun client you need to pass through a cache path

```javascript
const raygunClient = new raygun.Client().init({
  apiKey: 'YOUR_API_KEY',
  isOffline: false,
  offlineStorageOptions: {
    cachePath: 'raygunCache/',
    cacheLimit: 1000 // defaults to 100 errors if you don't set this
  }
});
```

##### Changing online/offline state

The Raygun client allows you to set it's online state when your application is running.

*To mark as offline*

    raygunClient.offline();

*To mark as online*

    raygunClient.online();

When marking as online any cached errors will be forwarded to Raygun.

##### Custom cache provider

You're able to provide your own cache provider if you can't access to the disk. When creating your Raygun client, pass in the storage provider on the offlineStorage property

Example:

```javascript
const sqlStorageProvider = new SQLStorageProvider();

const raygunClient = new raygun.Client().init({
  apiKey: 'YOUR_API_KEY',
  isOffline: false,
  offlineStorage: sqlStorageProvider,
  offlineStorageOptions: {
    table: 'RaygunCache'
  }
});
```

*Required methods*

* init(offlineStorageOptions) - Called when Raygun is marked as offline. offlineStorageOptions is an object with properties specific to each offline provider
* save(transportItem, callback) - Called when marked as offline
* retrieve(callback) - Returns an array of cached item filenames/ids
* send(callback) - Sends the backlog of errors to Raygun

See [lib/raygun.offline.ts](lib/raygun.offline.ts) for an example.

We recommend that you limit the number of errors that you are caching so that you don't swamp the clients internet connection sending errors.

### Custom error grouping

You can provide your own grouping key if you wish. We only recommend this you're having issues with errors not being grouped properly.

When initializing Raygun, pass through a `groupingKey` function.

```javascript
const raygunClient = new raygun.Client().init({
  apiKey: 'YOUR_API_KEY',
  groupingKey: function(message, exception, customData, request, tags) {
    return "CUSTOMKEY";
  }
});
```

### Custom error objects

By default Raygun4Node tries to convert unknown objects into a human readable string to help with grouping, this doesn't always make sense.

To disable it:

```javascript
const raygunClient = new raygun.Client().init({
  apiKey: 'YOUR_API_KEY',
  useHumanStringForObject: false
});
```

If your custom error object inherits from `Error` as its parent prototype, this isn't necessary however and these will be sent correctly.

### Report column numbers

By default Raygun4Node doesn't include column numbers in the stack trace. To include column numbers add the option `reportColumnNumbers` set to true to the configuration.

```javascript
const raygunClient = new raygun.Client().init({
  apiKey: 'YOUR_API_KEY',
  reportColumnNumbers: true
});
```

Including column numbers can enable source mapping if you have minified or transpiled code in your stack traces.

### APM Bridge Setup

Raygun4Node can be used in conjunction with Raygun APM for Node.js.

Follow the instructions on https://raygun.com/platform/apm to set up your application.

Then, call to `setApmBridge()` to connect both packages:

```js
raygunClient.setApmBridge(require("raygun-apm/lib/src/crash_reporting"));
```

When this package sends an error report to Raygun, it will notify automatically the Raygun APM package, and attach a Correlation ID to the error sent.

### Source maps

Raygun supports source mapping for Node.js stacktraces which include column numbers. To enable this feature you will need to upload your map files to the JavaScript Source Map Center and enable the processing of Node.js error stacktraces.

##### Using Private Source Maps with Node.js apps
Raygun supports source mapping for Node.js stacktraces which include column numbers. To enable this feature simply upload your map files as per the instructions on this page and enable the processing of Node.js errors with this setting in Raygun.

### Node.js source maps

Managing files in the JavaScript Source Map Center
Files in the JavaScript Source Map Center can be managed via a few API calls.

A GET request to `https://app.raygun.com/jssymbols/[applicationIdentifier]` will return a JSON object listing all files within the center. eg.

```bash
curl
  -X GET
  -u my@email.com:mypassword
  https://app.raygun.com/jssymbols/[applicationIdentifier]
```

Returns:

```json
{
  "Count": totalNumberOfItems,
  "Items": [
    {
       "Url": "https://urlOfItem",
       "FileName": "fileName.js",
       "UploadedOn": "2016-01-01..."
    },
    ...
  ]
}
```

A DELETE request to `https://app.raygun.com/jssymbols/[applicationIdentifier]/all` will remove all files within the center. eg.

```bash
curl
  -X DELETE
  -u my@email.com:mypassword
  https://app.raygun.com/jssymbols/[applicationIdentifier]/all
```

A DELETE request to `https://app.raygun.com/jssymbols/[applicationIdentifier]` will remove files with the specified URLS from the center. eg.

```bash
curl
  -X DELETE
  -u my@email.com:mypassword
  -F "url=https://example.com/js/myjs.min.map"
  https://app.raygun.com/jssymbols/[applicationIdentifier]
```

All requests use the same authentication methods as the upload call (Basic Authentication and Token Authentication).

### Examples
View a screencast on creating an app with Node.js and Express.js, then hooking up the error handling and sending them at [https://raygun.com/blog/2013/07/video-nodejs-error-handling-with-raygun/](https://raygun.com/blog/2013/07/video-nodejs-error-handling-with-raygun/)

### Debug Logging
You can enable logging of debug information from the Raygun client by setting the environment variable `DEBUG=raygun`. The client will then log information about transporting and storing errors, including timing information.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using "npm test".

## Release History

[View the changelog here](CHANGELOG.md)

## License
Copyright (c) 2016 Raygun Limited

Licensed under the MIT license.
