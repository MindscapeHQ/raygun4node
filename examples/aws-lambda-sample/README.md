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

To run this example, you have to create first an AWS Lambda function.

Follow the instructions in AWS' website: https://docs.aws.amazon.com/lambda/latest/dg/getting-started.html

Once your function is ready, use the "Upload from" to upload the generated `example.zip` file.

![Screenshot from 2024-06-06 10-32-40](https://github.com/MindscapeHQ/raygun4node/assets/2494376/a9c5bc6b-fb12-49c6-bfb1-20f0fe87caac)

## Example setup

Before running the example, you have to complete the following setup.

1. Add `RAYGUN` environment variable with your API key.
2. Add `DEBUG` environment variable with the value `raygun` to see detailed logs.

![Screenshot from 2024-06-06 10-33-33](https://github.com/MindscapeHQ/raygun4node/assets/2494376/54eb500e-5ede-43b1-a3ee-b39acb589a94)

3. Under the `Test` tab, create a new event with the following content:

![Screenshot from 2024-06-06 10-32-57](https://github.com/MindscapeHQ/raygun4node/assets/2494376/9fad284b-584d-41d8-a9de-fcdf1a11a341)

## Run the sample

Finally, select the newly created event and click the "Test" button.

![Screenshot from 2024-06-06 10-33-11](https://github.com/MindscapeHQ/raygun4node/assets/2494376/762e07b9-e456-4dc2-b9b9-65228ef7f09c)

You should see execution results similar to these:

```
Test Event Name
RaygunError

Response
{
  "errorType": "string",
  "errorMessage": "It's an AWS error!",
  "trace": []
}

Function Logs
START RequestId: xyz Version: $LATEST
2024-06-06T08:33:41.023Z raygun [raygun.breadcrumbs.ts] running async function with breadcrumbs
2024-06-06T08:33:41.062Z raygun [raygun.breadcrumbs.ts] recorded breadcrumb: xyz
2024-06-06T08:33:41.063Z raygun [raygun.messageBuilder.ts] Added breadcrumbs: 1
2024-06-06T08:33:41.542Z	xyz ERROR	Invoke Error 	{"errorType":"Error","errorMessage":"AWS Error from callback!","stack":["Error: AWS Error from callback!","  ....
2024-06-06T08:33:41.542Z raygun [raygun.ts] Successfully sent message (duration=479ms)
END RequestId: xyz
REPORT RequestId: xyz	Duration: 627.86 ms	Billed Duration: 628 ms	Memory Size: 128 MB	Max Memory Used: 78 MB

Request ID
xyz
```

The sent error should appear on your Raygun Crash Reporting console as well.

## Interesting files to look

- `index.js` contains the AWS Lambda function code.
