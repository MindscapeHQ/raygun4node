const { test } = require("tap");
const { exec } = require("child_process");

test("batch transport doesn't keep processes alive", async (t) => {
  await new Promise((resolve, reject) => {
    const process = exec(
      "node test/fixtures/batch_lifecycle.js",
      (error, stdout, stderr) => {
        if (error) {
          console.log(stdout);
          console.error(stderr);
          return reject(error);
        }

        t.equal(process.exitCode, 0);
        resolve();
      }
    );
  });
});
