import * as transport from "./raygun.transport";
import { SendOptions, SendOptionsWithoutCB } from "./types";

let data = "";

process.stdin.on("data", function (chunk) {
  data += chunk.toString();
});

process.stdin.on("end", function () {
  const options: SendOptionsWithoutCB = JSON.parse(data);
  const sendOptions = { ...options, callback };

  transport.send(sendOptions);

  function callback(error: Error | null, result: any) {
    if (error) {
      console.log("Error sending with sync transport", error);
    } else {
      console.log(
        "[raygun-apm] Successfully reported uncaught exception to Raygun"
      );
    }
  }
});
