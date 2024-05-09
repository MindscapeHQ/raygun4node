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

- `app.js`
  - Setup of Raygun (lines 9-12)
  - Sets the user (lines 27-29)
  - Attaches Raygun to Express (line 60)
- `routes/index.js`
  - Tries to use a fake object, which bounces up to the Express handler (lines 11-15)
