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
import { SendOptions } from "./types";

const API_HOST = "api.raygun.io";

function getFullPath(options: SendOptions) {
  const useSSL = options.useSSL;
  const port = useSSL ? 443 : 80;
  const protocol = useSSL ? "https" : "http";

  return `${protocol}://${API_HOST}:${port}/entries`;
}

export function send(options: SendOptions) {
  try {
    const data = Buffer.from(JSON.stringify(options.message));
    const fullPath = getFullPath(options);

    const httpOptions = {
      host: options.host || API_HOST,
      port: options.port || 443,
      path: fullPath,
      method: "POST",
      headers: {
        Host: API_HOST,
        "Content-Type": "application/json",
        "Content-Length": data.length,
        "X-ApiKey": options.apiKey,
      },
    };
    const cb = function (response: IncomingMessage) {
      if (options.callback) {
        if (options.callback.length > 1) {
          options.callback(null, response);
        } else {
          options.callback(response);
        }
      }
    };
    const httpLib = options.useSSL ? https : http;
    const request = httpLib.request(httpOptions, cb);

    request.on("error", function (e) {
      console.log(
        `Raygun: error ${e.message} occurred while attempting to send error with message: ${options.message}`
      );

      // If the callback has two parameters, it should expect an `error` value.
      if (options.callback && options.callback.length > 1) {
        options.callback(e);
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
