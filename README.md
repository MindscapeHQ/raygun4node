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

`IncomingMessage` is the response from the Raygun API - there's nothing in the body, it's just a status code response. If everything went ok, you'll get a 202 response code. 
Otherwise, we return 401 for incorrect API keys, 403 if you're over your plan limits, or anything in the 500+ range for internal errors.

We use the nodejs `http`/`https` library to make the POST to Raygun, you can see more documentation about that callback here: https://nodejs.org/api/http.html#http_http_request_options_callback .

You can `await` the call to obtain the result, or use `then/catch`.

The default timeout for the transport layer is 5000ms. You can override this value by setting a custom `timeout` (also in ms) when you initialize the Raygun client:

```typescript
import * as Raygun from 'raygun';

const raygunClient = new Raygun.Client().init({
  apiKey: 'YOUR_API_KEY',
  ...
  timeout: 3000 // defaults to 5000ms
});
```

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

### Send Parameters

The `send()` method accepts a series of optional named parameters, defined as follows:

```js
client.send(error, { customData, request, tags, timestamp, userInfo });
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

### Timestamp

You can specify the exact time your error occurred in the Send() function with the `timestamp` parameter.
Otherwise, the current time will be used.

This can be useful when combining Raygun together with other logger tools that provide a timestamp.

In milliseconds since epoch:

```javascript
client.send(new Error(), { timestamp: 1718268992929 });
```

As `Date` object:

```javascript
client.send(new Error(), { timestamp: new Date(2024, 5, 13, 10, 0, 0) });
```

### Customers

You can attach user information to every Raygun Crash Report.

It will be transmitted with the error sent, and a count of affected customers will appear on the dashboard in the error group view.
If you provide an email address, and the user has associated a Gravatar with it, their picture will be also displayed.

This package offers two different ways to do that:

1. Provide the `userInfo` parameter in the `send()` method.
2. Implement the `user(request)` method.

#### User information object

The following properties can be provided as user information:

- `identifier`: Unique identifier for the user is the user identifier.
- `email`: User's email address.
- `isAnonymous`: Flag indicating if the user is anonymous or not.
- `firstName`: User's first name (what you would use if you were emailing them - "Hi {{firstName}}, ...")
- `fullName`: User's full name.
- `uuid`: Device unique identifier. Useful if sending errors from a mobile device.

All properties are `strings` except `isAnonymous`, which is a boolean.
As well, they are all optional. Any other properties will be discarded.

Example:

```js
userInfo = {
    identifier: "123",
    email: "user@example.com",
    isAnonymous: false,
    firstName: "First name",
    fullName: "Fullname",
    uuid: "a25dfe58-8db3-496c-8768-375595139375",
}
```

For legacy support reasons, you can also provide the `string` identifier directly as the user information:

```js
raygunClient.send(error, { userInfo: "123" });
```

#### `userInfo` parameter in `send()`

Provide the `userInfo` optional parameter in the `send()` method call:

```javascript
client.send(new Error(), { userInfo });
```

This provided user information will take priority over the `user(request)` method.

#### Implement `raygunClient.user(req)`

You can set `raygunClient.user` to a function that returns the user name or email address of the currently logged in user.

An example, using the Passport.js middleware:

```javascript
const raygunClient = new raygun.Client().init({apiKey: "YOUR_API_KEY"});

raygunClient.user = function (req) {
  if (req.user) {
    return {
      identifier: req.user.username,
      email: req.user.email,
      isAnonymous: false,
      fullName: req.user.fullName,
      firstName: req.user.firstName,
      uuid: req.user.deviceID
    };
  }
}
```

**Param**: *req*: the current request.
**Returns**: The current user's identifier, or an object that describes the user.

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

From the supplied function, you should return either the payload (intact or mutated as per your needs), or `null`.

If your function returns a truthy object, Raygun4Node will attempt to send it as supplied. Thus, you can mutate it as per your needs - preferably only the values if you wish to filter out data that is not taken care of by the filters. You can also of course return it as supplied.

If, after inspecting the payload, you wish to discard it and abort sending it to Raygun, simply return `null`.

For example:

```javascript
const myBeforeSend = function (payload, exception, customData, request, tags) {
  console.log(payload); // Modify the payload here if necessary
  return payload; // Return null here instead of payload to abort the send
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

#### Sending Breadcrumbs

When an error message is sent to Raygun Crash Reporting, all the registered Breadcrumbs will be attached automatically.

After the error message has been sent, the registered Breadcrumbs list be cleared automatically.

Otherwise, you can also clear Breadcrumbs with `client.clearBreadcrumbs()`.

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
The order in which the middlewares are configured is important. `expressHandlerBreadcrumbs` must go first to scope breadcrumbs correctly.

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

The default timeout for batch transport calls is 5000ms. You can override this value by setting a custom `timeout` (also in ms) when you initialize the Raygun client:

```typescript
import * as Raygun from 'raygun';

const raygunClient = new Raygun.Client().init({
  apiKey: 'YOUR_API_KEY',
  batch: true,
  batchFrequency: 5000, // defaults to 1000ms (every second)
  timeout: 10000 // defaults to 5000ms
});
```

### Offline caching

Raygun can cache errors thrown by your Node application when it's running in 'offline' mode. By default the offline cache is disabled. Raygun4Node does not detect nor manage network state for you. It is up to the application using the library's functionality to manage online/offline state changes. 

Raygun includes an on-disk cache provider out of the box, which requires write permissions to the folder you wish to use. You can also pass in your own cache storage. The default, on-disk cache provider will store crash reports as individual `.json` files in the specified directory.

##### Getting setup with the default offline provide

When creating your Raygun client you need to pass through a cache path

```javascript
const raygunClient = new raygun.Client().init({
  apiKey: 'YOUR_API_KEY',
  isOffline: true,
  offlineStorageOptions: {
    cachePath: 'raygunCache/',
    cacheLimit: 1000 // defaults to 100 errors if you don't set this
  }
});
```

Setting `isOffline: true` tells the provider to start in `offline` mode. It will also trigger the initialisation of the cache, respectively - if the cache directory already exists - it will connect to the cache as specified in `offlineStorageOptions`.

##### Changing online/offline state

The Raygun client allows you to set its online state when your application is running.

*To mark as offline*

    raygunClient.offline();

*To mark as online*

    raygunClient.online();

When marking as online any cached errors from the currently configured cache provider will be forwarded to Raygun. This action will respect whatever transport mode (batched or individual HTTP requests) you have currently configured. 

If you change between different cache providers or change the storage directory of the on-disk cache provider, please make sure to trigger processing the offline reports before making such a change.

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

We recommend that you limit the number of errors that you are caching so that you don't swamp the client's internet connection sending errors.

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

### Known Issues

- Node will show compilation warnings when using Raygun4Node in Webpack applications.
- Although Breadcrumbs report the source filename, code line and function name, these are not processed using source maps like with stack traces.

### Examples
View a screencast on creating an app with Node.js and Express.js, then hooking up the error handling and sending them at [https://raygun.com/blog/2013/07/video-nodejs-error-handling-with-raygun/](https://raygun.com/blog/2013/07/video-nodejs-error-handling-with-raygun/)

### Debug Logging
You can enable logging of debug information from the Raygun client by setting the environment variable `DEBUG=raygun`. The client will then log information about transporting and storing errors, including timing information.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using `npm run test`, `npm run eslint`, `npm run tseslint` and `npm run prettier`.

## Release History

[View the changelog here](CHANGELOG.md)

## License
Copyright (c) 2016 Raygun Limited

Licensed under the MIT license.
