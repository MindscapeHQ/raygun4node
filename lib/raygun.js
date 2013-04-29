/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2013 MindscapeHQ
 * Licensed under the MIT license.
 */

'use strict';

var raygunTransport = require('./raygun.transport');
var MessageBuilder = require('./raygun.messageBuilder');

var raygun = function () {
  var _apiKey, _raygunTransport = raygunTransport.raygunTransport();

  var init = function (options) {
    _apiKey = options.apiKey;
    return this;
  };

  var send = function (exception, customData, callback) {
    var builder = new MessageBuilder()
      .setErrorDetails(exception)
      .setMachineName()
      .setEnvironmentDetails()
      .setUserCustomData(customData);

    var message = builder.build();
    _raygunTransport.send({ message: message, apiKey: _apiKey, callback: callback });
    return message;
  };

  var expressHandler = function (err, req, res, next) {
    send(err);
    next(err);
  };

  return {
    init: init,
    send: send,
    expressHandler: expressHandler
  };
};

exports.client = raygun;
