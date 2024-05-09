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
      `[Raygun4Node] Successfully reported uncaught exception to Raygun`,
    );
  })
  .catch((error) => {
    console.error(`[Raygun4Node] Error sending with sync transport`, error);
  });
