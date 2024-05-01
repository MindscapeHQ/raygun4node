/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

"use strict";

import { spawnSync } from "child_process";
import { SendOptionsWithoutCB } from "./types";

const requestProcessSource = require.resolve("./raygun.sync.worker");

function syncRequest(httpOptions: SendOptionsWithoutCB) {
  const requestProcess = spawnSync("node", [requestProcessSource], {
    input: JSON.stringify(httpOptions),
  });

  console.log(requestProcess.stdout.toString());
}

export function send(options: SendOptionsWithoutCB) {
  try {
    syncRequest(options);
  } catch (e) {
    console.log(
      `Raygun: error ${e} occurred while attempting to send error with message: ${options.message}`
    );
  }
}
