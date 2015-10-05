/*jshint unused:vars */

/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

'use strict';

var raygunTransport = require('./raygun.transport');
var MessageBuilder = require('./raygun.messageBuilder');
var offlineStorage = require('./raygun.offline');

var Raygun = function () {
  var _apiKey, _filters, raygun = this, _user, _version, _host, _port, _useSSL, _onBeforeSend, _offlineStorage, _isOnline;

  raygun.init = function (options) {
    _apiKey = options.apiKey;
    _filters = options.filters;
    _host = options.host;
    _port = options.port;
    _useSSL = options.useSSL || true;
    _onBeforeSend = options.onBeforeSend;
    _offlineStorage = options.offlineStorage == undefined ? new offlineStorage() : options.offlineStorage;
    _isOnline = options.isOnline;

    return raygun;
  };

  raygun.user = function (req) {
    return;
  };

  // This function is deprecated, is provided for legacy apps and will be
  // removed in 1.0: use raygun.user instead
  raygun.setUser = function (user) {
    _user = user;
    return raygun;
  };

  raygun.setVersion = function (version) {
    _version = version;
    return raygun;
  };

  raygun.onBeforeSend = function (onBeforeSend) {
    _onBeforeSend = onBeforeSend;
    return raygun;
  };

  raygun.offline = function() {
      _isOnline = false;
  };

  raygun.online = function(callback) {
    _isOnline = true;
    _offlineStorage.send(callback);
  };

  raygun.send = function (exception, customData, callback, request, tags) {
    var builder = new MessageBuilder({ filters: _filters })
      .setErrorDetails(exception)
      .setRequestDetails(request)
      .setMachineName()
      .setEnvironmentDetails()
      .setUserCustomData(customData)
      .setUser(raygun.user(request) || _user)
      .setVersion(_version)
      .setTags(tags);

    var message = builder.build();
    if (raygun.onBeforeSend) {
      message = typeof _onBeforeSend === 'function' ? _onBeforeSend(message, exception, customData, request, tags) : message;
    }

    raygunTransport.send({
      message: message,
      apiKey: _apiKey,
      callback: callback,
      host: _host,
      port: _port,
      useSSL: _useSSL
    });
    return message;
  };

  raygun.expressHandler = function (err, req, res, next) {
    raygun.send(err, {}, function () {}, req);
    next(err);
  };
};

exports.Client = Raygun;
