/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2013 Martin Holman
 * Licensed under the MIT license.
 */

'use strict';

var raygunTransport = require('./raygun.transport');
var messageBuilder = require('./raygun.messageBuilder');

var raygun = function () {
  var _apiKey, _raygunTransport = raygunTransport.raygunTransport();

  var init = function (options) {
    _apiKey = options.apiKey;
    return this;
  };

  var send = function (exception, customData, callback) {
    var builder = messageBuilder.raygunMessageBuilder();
    var message = builder.build();
    _raygunTransport.send({ message: message, apiKey: _apiKey, callback: callback });
    return message;
  };

  return {
    init: init,
    send: send,
  };
};

exports.client = raygun;
