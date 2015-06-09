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
  var data = JSON.stringify(options.message);
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
    // If the callback has two parameters, it should expect an `error` value.
    if (options.callback) {
      if (options.callback.length > 1) {
        options.callback(null, response);
      } else {
        options.callback(response);
      }
    }
  });
  request.on("error", function(err) {
    // If the callback has two parameters, it should expect an `error` value.
    if (options.callback && options.callback.length > 1) {
      options.callback(err);
    }
  });
  request.write(data);
  request.end();
};

exports.send = send;
