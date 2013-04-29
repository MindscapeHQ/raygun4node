/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2013 MindscapeHQ
 * Licensed under the MIT license.
 */

'use strict';

var stackTrace = require('stack-trace');
var os = require('os');
var packageDetails = require('../package.json');

var RaygunMessageBuilder = function () {
  var message = {
    occurredOn: new Date(),
    details: {
      client: {
        name: 'raygun-node',
        version: packageDetails.version
      }
    }
  };

  this.build = function () {
    return message;
  };

  this.setErrorDetails = function (error) {
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
      stackTrace: stack,
      message: error.message || "NoMessage",
      className: error.name
    };

    return this;
  };

  this.setEnvironmentDetails = function () {
    var cpus = os.cpus();
    message.details.environment = {
      processorCount: cpus.length,
      osVersion: os.type() + ' ' + os.platform() + ' ' + os.release(),
      cpu: cpus[0].model,
      architecture: os.arch(),
      totalPhysicalMemory: os.totalmem(),
      availablePhysicalMemory: os.freemem(),
      utcOffset: new Date().getTimezoneOffset() / -60.0,
    };

    return this;
  };

  this.setMachineName = function (machineName) {
    message.details.machineName = machineName || os.hostname();
    return this;
  };

  this.setUserCustomData = function (customData) {
    message.details.userCustomData = customData;
    return this;
  };
};

exports = module.exports = RaygunMessageBuilder;
