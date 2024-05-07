import fs from "fs";
import * as transport from "./raygun.transport";
import { SendOptionsWithoutCB } from "./types";

// Read stdin synchronously
const data = fs.readFileSync(0, "utf-8");

const options: SendOptionsWithoutCB = JSON.parse(data);

transport.send(options).then((response) => {
  console.log(
      "[raygun-apm] Successfully reported uncaught exception to Raygun",
  );
}).catch((error) => {
  console.log("Error sending with sync transport", error);
});
