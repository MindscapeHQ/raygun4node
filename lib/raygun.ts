/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

"use strict";

import {
  callVariadicCallback,
  Callback,
  CustomData,
  Hook,
  Message,
  MessageTransport,
  IOfflineStorage,
  OfflineStorageOptions,
  RawUserData,
  RaygunOptions,
  RequestParams,
  SendOptions,
  Tag,
  Transport,
} from "./types";
import type { IncomingMessage } from "http";
import type { Request, Response, NextFunction } from "express";
import { RaygunBatchTransport } from "./raygun.batch";
import { RaygunMessageBuilder } from "./raygun.messageBuilder";
import { OfflineStorage } from "./raygun.offline";
import { startTimer } from "./timer";
import * as raygunTransport from "./raygun.transport";
import * as raygunSyncTransport from "./raygun.sync.transport";

import { v4 as uuidv4 } from "uuid";

type SendOptionsResult =
  | { valid: true; message: Message; options: SendOptions }
  | { valid: false; message: Message };

const debug = require("debug")("raygun");

let apmBridge:
  | undefined
  | null
  | { notify(e: string | Error, s: string): void } = undefined;

try {
  if (module.parent) {
    apmBridge = module.parent.require("raygun-apm/lib/src/crash_reporting");
  } else {
    apmBridge = require("raygun-apm/lib/src/crash_reporting");
  }
} catch (e) {
  apmBridge = null;
}

type SendCB = (error: Error | null, items: string[] | undefined) => void;

const DEFAULT_BATCH_FREQUENCY = 1000; // ms

function emptyCallback() {}

class Raygun {
  _apiKey: string | undefined;
  _filters: string[] = [];
  _user: RawUserData | undefined;
  _version: string = "";
  _host: string | undefined;
  _port: number | undefined;
  _useSSL: boolean | undefined;
  _onBeforeSend: Hook<Message> | undefined;
  _offlineStorage: IOfflineStorage | undefined;
  _isOffline: boolean | undefined;
  _offlineStorageOptions: OfflineStorageOptions | undefined;
  _groupingKey: Hook<string> | undefined;
  _tags: Tag[] | undefined;
  _useHumanStringForObject: boolean | undefined;
  _reportColumnNumbers: boolean | undefined;
  _innerErrorFieldName: string | undefined;
  _batch: boolean = false;
  _batchTransport: RaygunBatchTransport | undefined;

  init(options: RaygunOptions) {
    this._apiKey = options.apiKey;
    this._filters = options.filters || [];
    this._host = options.host;
    this._port = options.port;
    this._useSSL = options.useSSL !== false;
    this._onBeforeSend = options.onBeforeSend;
    this._isOffline = options.isOffline;
    this._groupingKey = options.groupingKey;
    this._tags = options.tags;
    this._useHumanStringForObject =
      options.useHumanStringForObject === undefined
        ? true
        : options.useHumanStringForObject;
    this._reportColumnNumbers = options.reportColumnNumbers;
    this._innerErrorFieldName = options.innerErrorFieldName || "cause"; // VError function to retrieve inner error;

    debug(`client initialized`);

    if (options.reportUncaughtExceptions) {
      this.reportUncaughtExceptions();
    }

    if (options.batch && this._apiKey) {
      const frequency = options.batchFrequency || DEFAULT_BATCH_FREQUENCY;
      this._batch = options.batch;
      this._batchTransport = new RaygunBatchTransport({
        interval: frequency,
        httpOptions: {
          host: this._host,
          port: this._port,
          useSSL: !!this._useSSL,
          apiKey: this._apiKey,
        },
      });
    }

    this.expressHandler = this.expressHandler.bind(this);
    this.send = this.send.bind(this);

    this._offlineStorage =
      options.offlineStorage || new OfflineStorage(this.offlineTransport());
    this._offlineStorageOptions = options.offlineStorageOptions;

    if (this._isOffline) {
      this._offlineStorage.init(this._offlineStorageOptions);
    }

    return this;
  }

  user(req?: Request): RawUserData | null {
    return null;
  }

  // This function is deprecated, is provided for legacy apps and will be
  // removed in 1.0: use raygun.user instead
  setUser(user: RawUserData) {
    this._user = user;
    return this;
  }

  expressCustomData(error: Error, request: Request) {
    return {};
  }

  setVersion(version: string) {
    this._version = version;
    return this;
  }

  onBeforeSend(onBeforeSend: Hook<Message>) {
    this._onBeforeSend = onBeforeSend;
    return this;
  }

  groupingKey(groupingKey: Hook<string>) {
    this._groupingKey = groupingKey;
    return this;
  }

  offline() {
    this.offlineStorage().init(this._offlineStorageOptions);
    this._isOffline = true;
  }

  online(callback?: SendCB) {
    this._isOffline = false;
    this.offlineStorage().send(callback || emptyCallback);
  }

  setTags(tags: Tag[]) {
    this._tags = tags;
  }

  transport(): Transport {
    if (this._batch && this._batchTransport) {
      return this._batchTransport;
    }

    return raygunTransport;
  }

  send(
    exception: Error | string,
    customData?: CustomData,
    callback?: (err: Error | null) => void,
    request?: Request,
    tags?: Tag[]
  ): Message {
    const sendOptionsResult = this.buildSendOptions(
      exception,
      customData,
      callback,
      request,
      tags
    );

    const message = sendOptionsResult.message;

    if (!sendOptionsResult.valid) {
      console.error(
        `Encountered an error sending an error to Raygun. No API key is configured, please ensure .init is called with api key. See docs for more info.`
      );
      return sendOptionsResult.message;
    }

    const sendOptions = sendOptionsResult.options;

    if (this._isOffline) {
      this.offlineStorage().save(
        JSON.stringify(message),
        callback || emptyCallback
      );
    } else {
      this.transport().send(sendOptions);
    }

    return message;
  }

  private reportUncaughtExceptions() {
    const [major, minor, patch, ...rest] = process.versions.node
      .split(".")
      .map((part) => parseInt(part, 10));

    if (
      major < 12 ||
      (major === 12 && minor < 17) ||
      (major === 13 && minor < 7)
    ) {
      console.log(
        "[Raygun] Warning: reportUncaughtExceptions requires at least Node v12.17.0 or v13.7.0. Uncaught exceptions will not be automatically reported."
      );

      return;
    }

    const client = this;

    process.on("uncaughtExceptionMonitor", function (e) {
      client.sendSync(e);
    });
  }

  private sendSync(
    exception: Error | string,
    customData?: CustomData,
    callback?: (err: Error | null) => void,
    request?: Request,
    tags?: Tag[]
  ): void {
    const result = this.buildSendOptions(
      exception,
      customData,
      callback,
      request,
      tags
    );

    if (result.valid) {
      raygunSyncTransport.send(result.options);
    }
  }

  expressHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    let customData;

    if (typeof this.expressCustomData === "function") {
      customData = this.expressCustomData(err, req);
    } else {
      customData = this.expressCustomData;
    }

    this.send(err, customData || {}, function () {}, req, [
      "UnhandledException",
    ]);
    next(err);
  }

  stop() {
    if (this._batchTransport) {
      debug("batch transport stopped");
      this._batchTransport.stopProcessing();
    }
  }

  private buildSendOptions(
    exception: Error | string,
    customData?: CustomData,
    callback?: Callback<IncomingMessage>,
    request?: Request,
    tags?: Tag[]
  ): SendOptionsResult {
    let mergedTags: Tag[] = [];

    if (this._tags) {
      mergedTags = mergedTags.concat(this._tags);
    }

    if (tags) {
      mergedTags = mergedTags.concat(tags);
    }

    const builder = new RaygunMessageBuilder({
      filters: this._filters,
      useHumanStringForObject: this._useHumanStringForObject,
      reportColumnNumbers: this._reportColumnNumbers,
      innerErrorFieldName: this._innerErrorFieldName,
    })
      .setErrorDetails(exception)
      .setRequestDetails(request)
      .setMachineName()
      .setEnvironmentDetails()
      .setUserCustomData(customData)
      .setUser(this.user(request) || this._user)
      .setVersion(this._version)
      .setTags(mergedTags);

    let message = builder.build();

    if (this._groupingKey) {
      message.details.groupingKey =
        typeof this._groupingKey === "function"
          ? this._groupingKey(message, exception, customData, request, tags)
          : null;
    }

    if (this._onBeforeSend) {
      message =
        typeof this._onBeforeSend === "function"
          ? this._onBeforeSend(message, exception, customData, request, tags)
          : message;
    }

    if (apmBridge) {
      const correlationId = uuidv4();

      apmBridge.notify(exception, correlationId);

      message.details.correlationId = correlationId;
    }
    const apiKey = this._apiKey;

    if (!apiKey) {
      return { valid: false, message };
    }

    function wrappedCallback(
      error: Error | null,
      response: IncomingMessage | null
    ) {
      const durationInMs = stopTimer();
      if (error) {
        debug(`error sending message (duration=${durationInMs}ms): ${error}`);
      } else {
        debug(`successfully sent message (duration=${durationInMs}ms)`);
      }
      if (!callback) {
        return;
      }
      return callVariadicCallback(callback, error, response);
    }

    const stopTimer = startTimer();

    return {
      valid: true,
      message,
      options: {
        message: JSON.stringify(message),
        callback: wrappedCallback,
        http: {
          host: this._host,
          port: this._port,
          useSSL: !!this._useSSL,
          apiKey,
        },
      },
    };
  }

  private offlineTransport(): MessageTransport {
    const transport = this.transport();
    const client = this;

    return {
      send(message: string) {
        transport.send({
          message,
          callback: () => {},
          http: {
            host: client._host,
            port: client._port,
            useSSL: !!client._useSSL,
            apiKey: client._apiKey || "",
          },
        });
      },
    };
  }

  private offlineStorage(): IOfflineStorage {
    let storage = this._offlineStorage;

    if (storage) {
      return storage;
    }

    storage = this._offlineStorage = new OfflineStorage(
      this.offlineTransport()
    );

    return storage;
  }
}

export const Client = Raygun;
export type Client = Raygun;
export default { Client };
