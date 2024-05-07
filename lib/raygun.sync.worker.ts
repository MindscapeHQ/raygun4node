import fs from "fs";
import * as transport from "./raygun.transport";
import { SendOptions } from "./types";

// Read stdin synchronously
const data = fs.readFileSync(0, "utf-8");

const options: SendOptions = JSON.parse(data);

transport
  .send(options)
  .then((response) => {
    console.log(
      "[raygun-apm] Successfully reported uncaught exception to Raygun",
    );
  })
  .catch((error) => {
    console.log("Error sending with sync transport", error);
  });
