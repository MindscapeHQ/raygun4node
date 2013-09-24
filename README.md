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
client.send(new Error(), { 'version': 1.1 }, function (response){
```

### Examples
View a screencast on creating an app with Node.js and Express.js, then hooking up the error handling and sending them at [http://raygun.io/blog/2013/07/video-nodejs-error-handling-with-raygun/](http://raygun.io/blog/2013/07/video-nodejs-error-handling-with-raygun/)

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
- 0.2.0 - Added Express handler, bug fixes
- 0.1.2 - Include more error information
- 0.1.1 - Point at the correct API endpoint, include correct dependencies for NPM
- 0.1.0 - Initial release

## License
Copyright (c) 2013 MindscapeHQ
Licensed under the MIT license.
