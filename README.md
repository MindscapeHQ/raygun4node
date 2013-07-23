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

## Examples
View a screencast on creating an app with Node.js and Express.js, then hooking up the error handling and sending them at {{blogpost}}

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
