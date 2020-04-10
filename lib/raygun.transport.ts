/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

'use strict';

import http from 'http';
import https from 'https';

import {IncomingMessage} from 'http';

const API_HOST = 'api.raygun.io';

interface SendOptions {
  message: string;
  useSSL: boolean;
  host: string | null;
  port: number | null;
  apiKey: string;
  callback: Function;
}

function getFullPath(options: SendOptions) {
  var useSSL   = options.useSSL,
      port     = useSSL ? 443 : 80,
      protocol = useSSL ? 'https' : 'http';

  return protocol + '://' + API_HOST + ':' + port + '/entries';
};

export function send(options: SendOptions) {
  try {
    var data = Buffer.from(JSON.stringify(options.message));
    var fullPath = getFullPath(options);

    var httpOptions = {
      host: options.host || API_HOST,
      port: options.port || 443,
      path: fullPath,
      method: 'POST',
      headers: {
        'Host': API_HOST,
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-ApiKey': options.apiKey
      }
    };
    var cb = function (response: IncomingMessage) {
      if (options.callback) {
        if (options.callback.length > 1) {
          options.callback(null, response);
        } else {
          options.callback(response);
        }
      }
    };
    var httpLib = options.useSSL ? https : http;
    var request = httpLib.request(httpOptions, cb);

    request.on("error", function (e) {
      console.log("Raygun: error " + e.message + " occurred while attempting to send error with message: " + options.message);

      // If the callback has two parameters, it should expect an `error` value.
      if (options.callback && options.callback.length > 1) {
        options.callback(e);
      }
    });

    request.write(data);
    request.end();
  } catch (e) {
    console.log("Raygun: error " + e + " occurred while attempting to send error with message: " + options.message);
  }
};
