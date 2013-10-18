# Raygun4Node

Raygun.io plugin for Node

## Getting Started
Install the module with: `npm install raygun`

```javascript
var raygun = require('raygun');
var raygunClient = new raygun.Client().init({ apiKey: 'your API key' });
raygunClient.send(theError);

// For express, at the end of the middleware definitions:
app.use(raygunClient.expressHandler);
```

## Help

### Sending custom data

You can pass custom data in on the Send() function, as the second parameter. For instance (based off the call in test/raygun_test.js):

```javascript
client.send(new Error(), { 'mykey': 'beta' }, function (response){
```

### Unique user tracking

You can call setUser(string) to RaygunClient to pass in a user name or email address representing the current user context. This will be transmitted with each message sent, and a count of affected users will appear on the dashboard in the error group view. If you pass in an email address, and the user has associated a Gravatar with it, their picture will be also displayed.

Note that if your users can change context (log in/out), take care to call setUser() again to update their handle.

For user tracking in Express.js with the middleware handler, you can pass a function to setUser that will get the current user context (after you call init():

```javascript
// myUser is an email address or username
client.setUser(function () { return myUser } );
```

### Version tracking

Call setVersion(string) on a RaygunClient to set the version of the calling application. This is expected to be of the format x.x.x.x, where x is a positive integer. The version will be visible in the dashboard.

### Examples
View a screencast on creating an app with Node.js and Express.js, then hooking up the error handling and sending them at [http://raygun.io/blog/2013/07/video-nodejs-error-handling-with-raygun/](http://raygun.io/blog/2013/07/video-nodejs-error-handling-with-raygun/)

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
- 0.3.0 - Added version and user tracking functionality; bump jshint version, update test
- 0.2.0 - Added Express handler, bug fixes
- 0.1.2 - Include more error information
- 0.1.1 - Point at the correct API endpoint, include correct dependencies for NPM
- 0.1.0 - Initial release

## License
Copyright (c) 2013 MindscapeHQ
Licensed under the MIT license.
