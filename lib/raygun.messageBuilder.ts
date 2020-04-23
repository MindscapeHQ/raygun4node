/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

"use strict";

import os from "os";
import stackTrace from "stack-trace";

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
  BuiltError,
} from "./types";

type UserMessageData = RawUserData | string | undefined;

const humanString = require("object-to-human-string");
const packageDetails = require("../package.json");

function filterKeys(obj: { [key: string]: any }, filters: string[]) {
  if (!obj || !filters || typeof obj !== "object") {
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

function getStackTrace(
  error: Error,
  options: MessageBuilderOptions
): StackFrame[] {
  const stack: StackFrame[] = [];
  const trace = stackTrace.parse(error);

  trace.forEach(function (callSite) {
    const frame: StackFrame = {
      lineNumber: callSite.getLineNumber(),
      className: callSite.getTypeName() || "unknown",
      fileName: callSite.getFileName(),
      methodName: callSite.getFunctionName() || "[anonymous]",
    };

    if (
      !!options.reportColumnNumbers &&
      typeof callSite.getColumnNumber === "function"
    ) {
      frame.columnNumber = callSite.getColumnNumber();
    }

    stack.push(frame);
  });

  return stack;
}

function buildError(
  error: IndexableError,
  options: MessageBuilderOptions
): BuiltError {
  const builtError: BuiltError = {
    stackTrace: getStackTrace(error, options),
    message: error.message || "NoMessage",
    className: error.name,
  };

  let innerError: Error | undefined = undefined;

  if (options.innerErrorFieldName) {
    innerError =
      typeof error[options.innerErrorFieldName!] === "function"
        ? error[options.innerErrorFieldName!]()
        : error[options.innerErrorFieldName!];
  }

  if (innerError instanceof Error) {
    builtError.innerError = buildError(innerError, options);
  }

  return builtError;
}

export class RaygunMessageBuilder {
  _filters: string[];
  options: MessageBuilderOptions;
  message: MessageBuilding;

  constructor(options: MessageBuilderOptions = {}) {
    options = options || {};
    this.options = options;
    this._filters = options.filters || [];

    this.message = {
      occurredOn: new Date(),
      details: {
        client: {
          name: "raygun-node",
          version: packageDetails.version,
        },
      },
    };
  }

  build(): Message {
    // TODO - this provides no type safety that you actually passed what is needed
    // probably need to abandon the fluent builder pattern for better types
    return this.message as Message;
  }

  setErrorDetails(error: any) {
    if (!(error instanceof Error) && this.options.useHumanStringForObject) {
      error = humanString(error);
      this.message.details.groupingKey = error
        .replace(/\W+/g, "")
        .substring(0, 64);
    }

    if (typeof error === "string") {
      this.message.details.error = {
        message: error,
      };

      return this;
    }

    this.message.details.error = buildError(error, this.options);

    return this;
  }

  setEnvironmentDetails() {
    const environment: Environment = {
      osVersion: `${os.type()} ${os.platform()} ${os.release()}`,
      architecture: os.arch(),
      totalPhysicalMemory: os.totalmem(),
      availablePhysicalMemory: os.freemem(),
      utcOffset: new Date().getTimezoneOffset() / -60.0,
    };

    // cpus seems to return undefined on some systems
    const cpus = os.cpus();

    if (cpus && cpus.length && cpus.length > 0) {
      environment.processorCount = cpus.length;
      environment.cpu = cpus[0].model;
    }

    this.message.details.environment = environment;

    return this;
  }

  setMachineName(machineName?: string) {
    this.message.details.machineName = machineName || os.hostname();
    return this;
  }

  setUserCustomData(customData?: CustomData) {
    this.message.details.userCustomData = customData;
    return this;
  }

  setTags(tags: Tag[]) {
    if (Array.isArray(tags)) {
      this.message.details.tags = tags;
    }
    return this;
  }

  setRequestDetails(request: RequestParams | undefined) {
    if (request) {
      const host = "hostname" in request ? request.hostname : request.host;

      this.message.details.request = {
        hostName: host,
        url: request.path,
        httpMethod: request.method,
        ipAddress: request.ip,
        queryString: filterKeys(request.query, this._filters),
        headers: filterKeys(request.headers, this._filters),
        form: filterKeys(request.body, this._filters),
      };
    }
    return this;
  }

  setUser(user: (() => UserMessageData) | UserMessageData) {
    var userData: UserMessageData;

    if (user instanceof Function) {
      userData = user();
    } else {
      userData = user;
    }

    if (userData instanceof Object) {
      this.message.details.user = this.extractUserProperties(userData);
    } else if (typeof userData === "string") {
      this.message.details.user = { identifier: userData };
    }

    return this;
  }

  setVersion(version: string) {
    this.message.details.version = version;
    return this;
  }

  private extractUserProperties(userData: RawUserData): UserDetails {
    const data: UserDetails = {};
    if (userData.identifier) {
      data.identifier = userData.identifier;
    }
    if (userData.email) {
      data.email = userData.email;
    }
    if (userData.fullName) {
      data.fullName = userData.fullName;
    }
    if (userData.firstName) {
      data.firstName = userData.firstName;
    }
    if (userData.uuid) {
      data.uuid = userData.uuid;
    }
    return data;
  }
}
