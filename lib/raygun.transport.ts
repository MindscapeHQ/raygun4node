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
const DEFAULT_ENDPOINT = "/entries";
const BATCH_ENDPOINT = "/entries/bulk";

const debug = require("debug")("raygun");

export function sendBatch(options: SendOptions): Promise<IncomingMessage> {
  return send(options, BATCH_ENDPOINT);
}

/**
 * Transport implementation that sends error to Raygun.
 * Errors are reported back via callback.
 * @param options - without callback
 * @param path - service endpoint
 * @returns Promise with IncomingMessage or rejected with Error
 */
export function send(
  options: SendOptions,
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
          // if a timeout was set (indicating non-batch mode), destroy the request after successful completion
          if (options.http.timeout) {
            debug(
            `[raygun.transport.ts] Destroying request for message: ${options.message}`,
            );
            request.destroy();
            debug(
            `[raygun.transport.ts] Request destroyed for message: ${options.message}`,
            );
          }
        },
      );

      if (options.http.timeout) {
        request.setTimeout(options.http.timeout, () => {
          console.error(
            `[Raygun4Node] request timed out while attempting to send error with message: ${options.message}`,
          );
          request.destroy(new Error('Request timed out'));
        });
      }

      debug(`[raygun.transport.ts] HTTP Options set: ${httpOptions}`);

      request.on("error", function (e) {
        console.error(
          `[Raygun4Node] Error with details "${e.message}" occurred while attempting to send error with message: ${options.message}`,
        );

        // request failed
        reject(e);
      });

      request.write(data);
      request.end();
    });
  } catch (e) {
    console.error(
      `[Raygun4Node] error ${e} occurred while attempting to send error with message: ${options.message}`,
    );
    return Promise.reject(e);
  }
}
