/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2013 MindscapeHQ
 * Licensed under the MIT license.
 */

'use strict';

var http = require('https');

var raygunTransport = function () {

  var send = function (options) {
    var data = JSON.stringify(options.message);
    var httpOptions = {
      host: 'api.raygun.io',
      port: 443,
      path: '/entries',
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.length,
          'X-ApiKey': options.apiKey
      }
    };
    var request = http.request(httpOptions, options.callback);
    request.write(data);
    request.end();
  };

  return {
    send: send
  };
};

exports.raygunTransport = raygunTransport;
