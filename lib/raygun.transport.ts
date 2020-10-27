/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

"use strict";

import http from "http";
import https from "https";

import { IncomingMessage } from "http";
import { isCallbackWithError, callVariadicCallback, SendOptions } from "./types";

const debug = require("debug")("raygun");

const API_HOST = "api.raygun.io";
const DEFAULT_ENDPOINT = "/entries";
const BATCH_ENDPOINT = "/entries/bulk";

export function send(options: SendOptions) {
  console.log('send options #### ', options);
  try {
    const data = Buffer.from(options.message);
    const path = `${options.path}${options.batch ? BATCH_ENDPOINT : DEFAULT_ENDPOINT}`;

    const httpOptions = {
      host: options.http.host || API_HOST,
      port: options.http.port || 443,
      path: path,
      method: "POST",
      headers: {
        Host: API_HOST,
        "Content-Type": "application/json",
        "Content-Length": data.length,
        "X-ApiKey": options.http.apiKey,
      },
    };

    const cb = function (response: IncomingMessage) {
      if (options.callback) {
        return callVariadicCallback(options.callback, null, response);
      }
    };

    const httpLib = options.http.useSSL ? https : http;
    const request = httpLib.request(httpOptions, cb);

    request.on("error", function (e) {
      console.log(
        `Raygun: error ${e.message} occurred while attempting to send error with message: ${options.message}`
      );

      // If the callback has two parameters, it should expect an `error` value.
      if (options.callback && isCallbackWithError(options.callback)) {
        options.callback(e, null);
      }
    });

    request.write(data);
    request.end();
  } catch (e) {
    console.log(
      `Raygun: error ${e} occurred while attempting to send error with message: ${options.message}`
    );
  }
}
