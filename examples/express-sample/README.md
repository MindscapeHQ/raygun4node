# Raygun + ExpressJS sample

This is a sample Express application to show how to use Raygun4Node and ExpressJS together.

This example uses the local `raygun4node` package in the project root directory by simply pointing to the root directory as a dependency in package.json:

```
"raygun": "file:../..",
```

## Run the sample

First, install the `raygun4node` package.

To do so, navigate to the project root directory, then:

    npm install

Once the package is installed, set your API key in the sample's `config/default.json` and run:

    npm install && npm start

in the subdirectory where you found this README.md file.

## Interesting files to look

- `raygun.client.js`
  - Setup of Raygun (lines 9-14)
- `app.js`
  - Sets the user (lines 17-19)
  - Attaches Raygun Breadcrumb middleware to Express (line 26)
  - Attaches Raygun to Express (line 53)
- `routes/index.js`
  - `/send` endpoint: Sends a custom error to Raygun (lines 11-34)
  - `/error` endpoint: Tries to use a fake object, which bounces up to the Express handler (lines 36-49)
