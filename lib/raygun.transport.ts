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
import { SendOptionsWithoutCB } from "./types";

const API_HOST = "api.raygun.io";
const DEFAULT_ENDPOINT = "/entries";
const BATCH_ENDPOINT = "/entries/bulk";

export function sendBatch(
  options: SendOptionsWithoutCB,
): Promise<IncomingMessage> {
  return send(options, BATCH_ENDPOINT);
}

/**
 * Transport implementation that sends error to Raygun.
 * Errors are reported back via callback.
 * @param options without callback
 * @param path service endpoint
 * @return Promise with IncomingMessage or rejected with Error
 */
export function send(
  options: SendOptionsWithoutCB,
  path = DEFAULT_ENDPOINT,
): Promise<IncomingMessage> {
  try {
    const data = Buffer.from(options.message);

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

    // Wrap HTTP request in Promise
    return new Promise((resolve, reject) => {
      const httpLib = options.http.useSSL ? https : http;
      const request = httpLib.request(
        httpOptions,
        (response: IncomingMessage) => {
          // request completed successfully
          resolve(response);
        },
      );

      request.on("error", function (e) {
        console.log(
          `Raygun: error ${e.message} occurred while attempting to send error with message: ${options.message}`,
        );

        // request failed
        reject(e);
      });

      request.write(data);
      request.end();
    });
  } catch (e) {
    console.log(
      `Raygun: error ${e} occurred while attempting to send error with message: ${options.message}`,
    );
    return Promise.reject(e);
  }
}
