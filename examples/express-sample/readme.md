# Raygun + ExpressJS sample

A demo on how to use Raygun4Node and ExpressJS together.

This example uses the `raygun4node` package from the project root directory.

## To run

First, install the `raygun4node` package.
Navigate to the project root directory, then:

    npm install

Once the package is installed, set your API key in `config/default.json` and run:

    npm install && npm start

## Files to look at 

- `app.js`
  - Sets the user (line 22)
  - Attaches Raygun to Express (line 47)
- `routes/index.js`
  - Calls a fake object, which bounces up to the Express handler (line 11)
