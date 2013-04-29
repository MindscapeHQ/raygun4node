/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2013 Martin Holman
 * Licensed under the MIT license.
 */

'use strict';

var stackTrace = require('stack-trace');

var raygunMessageBuilder = function () {
  var message = {
    occurredOn: new Date(),
    details: {
      client: {
        name: 'raygun-node',
        version: '0.1.0'
      }
    }
  };

  var build = function () {
    return message;
  };

  var setErrorDetails = function (error) {
    var stack = [];
    var trace = stackTrace.parse(error);
    trace.forEach(function (callSite) {
      stack.push({
        lineNumber: callSite.getLineNumber(),
        className: callSite.getTypeName() || 'unknown',
        fileName: callSite.getFileName(),
        methodName: callSite.getFunctionName() || '[anonymous]'
      });
    });

    message.details.error = {
      stackTrace: stack
    };

    return this;
  };

  var setEnvironmentDetails = function () {
    message.environment = {};
  };

  return {
    build: build,
    setErrorDetails: setErrorDetails,
    setEnvironmentDetails: setEnvironmentDetails,
  };
};

exports.raygunMessageBuilder = raygunMessageBuilder;
