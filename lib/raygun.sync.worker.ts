import fs from "fs";

import * as transport from "./raygun.transport";
import { SendOptions, SendOptionsWithoutCB } from "./types";
import {IncomingMessage} from "http";

// Read stdin synchronously
const data = fs.readFileSync(0, "utf-8");

const options: SendOptionsWithoutCB = JSON.parse(data);
const sendOptions: SendOptions = { ...options, callback };

transport.send(sendOptions);

function callback(error: Error | null, result: IncomingMessage | null) {
  if (error) {
    console.log("Error sending with sync transport", error);
  } else {
    console.log(
      "[raygun-apm] Successfully reported uncaught exception to Raygun"
    );
  }
}
