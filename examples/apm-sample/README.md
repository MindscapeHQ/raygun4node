# Raygun Crash Reporting + APM Sample

This is a sample application to show how to use Raygun4Node and Raygun-APM together.

This example uses the local `raygun4node` package in the project root directory by simply pointing to the root directory as a dependency in package.json:

```
"raygun": "file:../..",
```

## Run the sample

First, install the `raygun4node` package.

To do so, navigate to the project root directory, then:

    npm install

Once the package is installed, set your API key in the sample's `config/default.json` and run:

    npm install && node app

in the subdirectory where you found this README.md file.
