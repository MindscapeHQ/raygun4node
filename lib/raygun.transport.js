/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

'use strict';

var http = require('https');

var send = function (options) {
  try {
    var data = new Buffer(JSON.stringify(options.message), 'utf8');
    var httpOptions = {
      host: 'api.raygun.io',
      port: 443,
      path: '/entries',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
          'X-ApiKey': options.apiKey
      }
    };
    var request = http.request(httpOptions, function (response) {
      if (options.callback) {
        options.callback(response);
      }
    });

    request.write(data);
    request.end();
  } catch (e) {
    console.log("Raygun: error " + e + " occurred while attempting to send error with message: " + options.message);
  }
};

exports.send = send;
