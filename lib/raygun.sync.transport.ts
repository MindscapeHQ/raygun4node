/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

"use strict";

import { spawnSync } from "child_process";
import { SendOptions } from "./types";

const requestProcessSource = require.resolve("./raygun.sync.worker");

function syncRequest(httpOptions: SendOptions) {
  const requestProcess = spawnSync("node", [requestProcessSource], {
    input: JSON.stringify(httpOptions),
  });

  console.log(requestProcess.stdout.toString());
}

/**
 * Spawns a synchronous send request.
 * Errors are not returned and callback is ignored.
 * Only used to report uncaught exceptions.
 * @param options
 */
export function send(options: SendOptions) {
  try {
    syncRequest(options);
  } catch (e) {
    // TODO: Is there a reason we ignore errors here?
    console.log(
      `Raygun: error ${e} occurred while attempting to send error with message: ${options.message}`,
    );
  }
}
