/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

'use strict';

import os from 'os';
import stackTrace from 'stack-trace';

import {
  MessageBuilderOptions,
  StackFrame,
  Message,
  MessageBuilding,
  IndexableError,
  RawUserData,
  UserDetails,
  RequestParams,
  Tag,
  CustomData,
  Environment,
  BuiltError
} from './types';

const humanString = require('object-to-human-string');
const packageDetails = require('../package.json');

function filterKeys(obj: {[key: string]: any}, filters: string[]) {
  if (!obj || !filters || typeof obj !== 'object') {
    return obj;
  }
  Object.keys(obj).forEach(function (i) {
    if (filters.indexOf(i) > -1) {
      delete obj[i];
    } else {
      obj[i] = filterKeys(obj[i], filters);
    }
  });
  return obj;
}

function getStackTrace(error: Error, options: MessageBuilderOptions): StackFrame[] {
  const stack: StackFrame[] = [];
  const trace = stackTrace.parse(error);

  trace.forEach(function (callSite) {
    const frame: StackFrame = {
      lineNumber: callSite.getLineNumber(),
      className: callSite.getTypeName() || 'unknown',
      fileName: callSite.getFileName(),
      methodName: callSite.getFunctionName() || '[anonymous]'
    };

    if (!!options.reportColumnNumbers && typeof (callSite.getColumnNumber) === 'function') {
      frame.columnNumber = callSite.getColumnNumber();
    }

    stack.push(frame);
  });

  return stack;
}

function buildError(error: IndexableError, options: MessageBuilderOptions): BuiltError {
  var builtError: BuiltError = {
    stackTrace: getStackTrace(error, options),
    message: error.message || "NoMessage",
    className: error.name
  }; 
  
  var innerError = typeof error[options.innerErrorFieldName] === 'function' ? error[options.innerErrorFieldName]() : error[options.innerErrorFieldName];

  if(innerError instanceof Error) {
    builtError.innerError = buildError(innerError, options);
  }
    
  return builtError;
}

type RaygunMessageBuilder = {
  build(): Message;
  setVersion(version: string): RaygunMessageBuilder;
  setUser(user: (() => RawUserData) | RawUserData): RaygunMessageBuilder;
  setRequestDetails(request: RequestParams): RaygunMessageBuilder;
  setTags(tags: Tag[]): RaygunMessageBuilder;
  setUserCustomData(customData: CustomData): RaygunMessageBuilder;
  setMachineName(machineName: string): RaygunMessageBuilder;
  setEnvironmentDetails(): RaygunMessageBuilder;
  setErrorDetails(error: any): RaygunMessageBuilder;

};

var RaygunMessageBuilder = function (this: RaygunMessageBuilder, options: MessageBuilderOptions) {
  options = options || {};
  var _filters: string[];

  if (Array.isArray(options.filters)) {
    _filters = options.filters;
  }

  var message : MessageBuilding = {
    occurredOn: new Date(),
    details: {
      client: {
        name: 'raygun-node',
        version: packageDetails.version
      }
    }
  };

  this.build = function () {
    // TODO - this provides no type safety that you actually passed what is needed
    // probably need to abandon the fluent builder pattern for better types
    return message as Message;
  };

  this.setErrorDetails = function (error: any) {
    if (!(error instanceof Error) && options.useHumanStringForObject) {
      error = humanString(error);
      message.details.groupingKey = error.replace(/\W+/g, "").substring(0, 64);
    }

    if (typeof error === "string") {
      message.details.error = {
        message: error
      };

      return this;
    }

    message.details.error = buildError(error, options);

    return this;
  };

  this.setEnvironmentDetails = function () {
    const environment: Environment = {
      osVersion: os.type() + ' ' + os.platform() + ' ' + os.release(),
      architecture: os.arch(),
      totalPhysicalMemory: os.totalmem(),
      availablePhysicalMemory: os.freemem(),
      utcOffset: new Date().getTimezoneOffset() / -60.0
    };

    // cpus seems to return undefined on some systems
    const cpus = os.cpus();

    if (cpus && cpus.length && cpus.length > 0) {
      environment.processorCount = cpus.length;
      environment.cpu = cpus[0].model;
    }

    message.details.environment = environment;

    return this;
  };

  this.setMachineName = function (machineName: string) {
    message.details.machineName = machineName || os.hostname();
    return this;
  };

  this.setUserCustomData = function (customData: CustomData) {
    message.details.userCustomData = customData;
    return this;
  };

  this.setTags = function (tags: Tag[]) {
    if (Array.isArray(tags)) {
      message.details.tags = tags;
    }
    return this;
  };

  this.setRequestDetails = function (request: RequestParams) {
    if (request) {
      message.details.request = {
        hostName: request.hostname || request.host,
        url: request.path,
        httpMethod: request.method,
        ipAddress: request.ip,
        queryString: filterKeys(request.query, _filters),
        headers: filterKeys(request.headers, _filters),
        form: filterKeys(request.body, _filters)
      };
    }
    return this;
  };

  var extractUserProperties = function(userData: RawUserData): UserDetails {
    const data: UserDetails = {};
    if(userData.identifier) {
      data.identifier = userData.identifier;
    }
    if(userData.email) {
      data.email = userData.email;
    }
    if(userData.fullName) {
      data.fullName = userData.fullName;
    }
    if(userData.firstName) {
      data.firstName = userData.firstName;
    }
    if(userData.uuid) {
      data.uuid = userData.uuid;
    }
    return data;
  };

  this.setUser = function (user: (() => RawUserData) | RawUserData) {
    var userData: RawUserData;
    if (user instanceof Function) {
      userData = user();
    } else {
      userData = user;
    }

    if (userData instanceof Object) {
        message.details.user = extractUserProperties(userData);
    } else {
        message.details.user = { 'identifier': userData };
    }

    return this;
  };

  this.setVersion = function (version: string) {
    message.details.version = version;
    return this;
  };
};

exports = module.exports = RaygunMessageBuilder;
