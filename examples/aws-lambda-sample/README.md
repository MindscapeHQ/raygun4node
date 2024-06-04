# Raygun + AWS Lambda Example

This is a sample AWS Lambda function to show how to use Raygun4Node and AWS Lambda together.

This example uses the local `raygun` and `@raygun/aws-lambda` packages in this project repository by simply pointing to the directories as a dependency in package.json:

```
"raygun": "file:../..",
"@raygun/aws-lambda": "file:../../aws-lambda"
```

## Prepare package

Run the `prepare.sh` script.

This script installs the dependencies, builds the example, and packages it in the `example.zip` file.

## Deploy

TODO

## Run the sample

TODO

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
