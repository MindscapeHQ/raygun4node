# Raygun + Domains sample

A demo on how to use Raygun4Node and a NodeJS domain.

This example uses the `raygun4node` package from the project root directory.

Please note that if you're using Node 12 onwards, we recommend using the `reportUncaughtExceptions` option in place of the `domains` module for reporting fatal errors.

## To run

First, install the `raygun4node` package.
Navigate to the project root directory, then run:

    npm install

Once the package is installed, set your API key in `config/default.json` and run:

    npm install && node app

## Files to look at

- `app.js`
