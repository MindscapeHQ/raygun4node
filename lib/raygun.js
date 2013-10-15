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

var Raygun = function () {
  var _apiKey, raygun = this, _user;

  raygun.init = function (options) {
    _apiKey = options.apiKey;
    return raygun;
  };

  raygun.setUser = function (user) {
    _user = user;
    return raygun;
  };

  raygun.send = function (exception, customData, callback, request) {
    var builder = new MessageBuilder()
      .setErrorDetails(exception)
      .setRequestDetails(request)
      .setMachineName()
      .setEnvironmentDetails()
      .setUserCustomData(customData)
      .setUser(_user);

    var message = builder.build();
    raygunTransport.send({ message: message, apiKey: _apiKey, callback: callback });
    return message;
  };

  raygun.expressHandler = function (err, req, res, next) {
    raygun.send(err, {}, function () {}, req);
    next(err);
  };
};

exports.Client = Raygun;
