/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

"use strict";

import { spawnSync } from "child_process";

import type { IncomingMessage, RequestOptions } from "http";
import {
  isCallbackWithError,
  callVariadicCallback,
  SendOptionsWithoutCB,
} from "./types";

const debug = require("debug")("raygun");

const API_HOST = "api.raygun.io";
const DEFAULT_ENDPOINT = "/entries";
const BATCH_ENDPOINT = "/entries/bulk";

const childCode = `
import http from "http";
import https from "https";
`;

const requestProcessSource = require.resolve("./raygun.sync.worker");

function syncRequest(httpOptions: SendOptionsWithoutCB) {
  const requestProcess = spawnSync("node", [requestProcessSource], {
    input: JSON.stringify(httpOptions),
  });

  console.log(requestProcess.stdout.toString());
}

export function send(options: SendOptionsWithoutCB) {
  try {
    const request = syncRequest(options);
  } catch (e) {
    console.log(
      `Raygun: error ${e} occurred while attempting to send error with message: ${options.message}`
    );
  }
}
