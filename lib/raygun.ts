/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

"use strict";

import {
  BreadcrumbMessage,
  CustomData,
  Hook,
  Message,
  MessageTransport,
  IOfflineStorage,
  OfflineStorageOptions,
  RaygunOptions,
  RequestParams,
  SendOptions,
  Tag,
  Transport,
  SendParameters,
  UserMessageData,
} from "./types";
import * as breadcrumbs from "./raygun.breadcrumbs";
import { addRequestBreadcrumb } from "./raygun.breadcrumbs.express";
import type { IncomingMessage } from "http";
import { Request, Response, NextFunction } from "express";
import { RaygunBatchTransport } from "./raygun.batch";
import { RaygunMessageBuilder } from "./raygun.messageBuilder";
import { OfflineStorage } from "./raygun.offline";
import { startTimer } from "./timer";
import * as raygunTransport from "./raygun.transport";
import * as raygunSyncTransport from "./raygun.sync.transport";

import { v4 as uuidv4 } from "uuid";

type SendOptionsResult =
  | { valid: true; message: Message; options: SendOptions; skip: boolean }
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
const DEFAULT_TIMEOUT = 5000; // ms

function emptyCallback() {}

class Raygun {
  _apiKey: string | undefined;

  _filters: string[] = [];

  _user: UserMessageData | undefined;

  _version: string = "";

  _host: string | undefined;

  _port: number | undefined;

  _useSSL: boolean | undefined;

  _timeout: number | undefined;

  _onBeforeSend: Hook<Message | null> | undefined;

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

  /**
   * Initializes the Raygun Client.
   * Use like:
   * ```js
   * const raygunClient = new Raygun.Client().init({
   *   apiKey: 'YOUR_API_KEY'
   * });
   * ```
   * @param options - Raygun Client options
   */
  init(options: RaygunOptions) {
    this._apiKey = options.apiKey;
    this._filters = options.filters || [];
    this._host = options.host;
    this._port = options.port;
    this._useSSL = options.useSSL !== false;
    this._onBeforeSend = options.onBeforeSend;
    this._timeout = options.timeout;
    this._isOffline = options.isOffline;
    this._groupingKey = options.groupingKey;
    this._tags = options.tags;
    this._useHumanStringForObject =
      options.useHumanStringForObject === undefined
        ? true
        : options.useHumanStringForObject;
    this._reportColumnNumbers = options.reportColumnNumbers;
    this._innerErrorFieldName = options.innerErrorFieldName || "cause"; // VError function to retrieve inner error;

    debug("[raygun.ts] Client initialized");

    if (options.reportUncaughtExceptions) {
      this.reportUncaughtExceptions();
    }

    if (options.batch && this._apiKey) {
      const frequency = options.batchFrequency || DEFAULT_BATCH_FREQUENCY;
      const batchTimeout = options.batchTimeout || DEFAULT_TIMEOUT;
      this._batch = options.batch;
      this._batchTransport = new RaygunBatchTransport({
        interval: frequency,
        httpOptions: {
          host: this._host,
          port: this._port,
          useSSL: !!this._useSSL,
          apiKey: this._apiKey,
          timeout: batchTimeout,
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

  /**
   * Override this method to provide user data from the send() method original request parameters.
   * @param req - as RequestParams, may be null if send() was called without providing request parameters.
   */
  user(req?: RequestParams): UserMessageData | null {
    return null;
  }

  /**
   * If you're using the `raygunClient.expressHandler`, you can send custom data along by setting this function.
   *
   * ```js
   * raygunClient.expressCustomData = function (err, req) {
   *   return { 'level': err.level };
   * };
   * ```
   *
   * @param error - error captured
   * @param request - original request object
   */
  expressCustomData(error: Error, request: Request) {
    return {};
  }

  /**
   * Set the version of the calling application
   * @param version - Version as String
   */
  setVersion(version: string) {
    this._version = version;
    return this;
  }

  /**
   * Access or mutate the candidate error payload immediately before it is sent,
   * or skip the sending action by returning null.
   * @param onBeforeSend - callback that must return a Message object to send, or null to skip sending it.
   */
  onBeforeSend(onBeforeSend: Hook<Message | null>) {
    this._onBeforeSend = onBeforeSend;
    return this;
  }

  /**
   * Set the grouping key. Also, available as `init()` configuration parameter.
   * @param groupingKey - grouping key method callback
   */
  groupingKey(groupingKey: Hook<string>) {
    this._groupingKey = groupingKey;
    return this;
  }

  /**
   * Notifies the Raygun Client that the machine is offline.
   * Raygun Crash Reports will be stored and sent when the machine is back online.
   */
  offline() {
    this.offlineStorage().init(this._offlineStorageOptions);
    this._isOffline = true;
  }

  /**
   * Notifies the Raygun Client that the machine is online.
   * Stored Raygun Crash Reports will be delivered.
   * @param callback - sent result callback
   */
  online(callback?: SendCB) {
    this._isOffline = false;
    this.offlineStorage().send(callback || emptyCallback);
  }

  /**
   * Set global tags to Raygun Client
   * @param tags - list of Tags
   */
  setTags(tags: Tag[]) {
    this._tags = tags;
  }

  /**
   * Adds breadcrumb to current context
   * @param breadcrumb - either a string message or a Breadcrumb object
   */
  addBreadcrumb(breadcrumb: string | BreadcrumbMessage) {
    breadcrumbs.addBreadcrumb(breadcrumb);
  }

  /**
   * Manually clear stored breadcrumbs for current context
   */
  clearBreadcrumbs() {
    breadcrumbs.clear();
  }

  transport(): Transport {
    if (this._batch && this._batchTransport) {
      return this._batchTransport;
    }

    return raygunTransport;
  }

  /**
   * Sends exception to Raygun.
   * @param exception - exception to send.
   * @param customData - custom data to attach to the error report.
   * @param request - custom RequestParams.
   * @param tags - list of Tags to attach to the error report.
   * @param timestamp - provides a custom timestamp as Date object or number in milliseconds since epoch.
   * @param userInfo - provides the user information to this error report. Has priority over the user(request) method.
   * @returns IncomingMessage if message was delivered, null if stored, rejected with Error if failed.
   */
  async send(
    exception: Error | string,
    { customData, request, tags, timestamp, userInfo }: SendParameters = {},
  ): Promise<IncomingMessage | null> {
    // Convert timestamp in milliseconds since epoch to Date
    const _timestamp =
      typeof timestamp === "number" ? new Date(timestamp) : timestamp;

    const sendOptionsResult = this.buildSendOptions(
      exception,
      customData,
      request,
      tags,
      _timestamp,
      userInfo,
    );

    const message = sendOptionsResult.message;

    if (!sendOptionsResult.valid) {
      console.error(
        "[Raygun4Node] Encountered an error sending an error to Raygun. No API key is configured, please ensure .init is called with api key. See docs for more info.",
      );
      return Promise.reject(sendOptionsResult.message);
    }

    if (sendOptionsResult.skip) {
      console.log(
        `[Raygun4Node] Skip sending message: ${sendOptionsResult.message.details.error}.`,
      );
      return Promise.resolve(null);
    }

    const sendOptions = sendOptionsResult.options;
    if (this._isOffline) {
      // Server is offline, store in Offline Storage
      return new Promise((resolve, reject) => {
        this.offlineStorage().save(JSON.stringify(message), (error) => {
          if (error) {
            console.error(
              "[Raygun4Node] Error storing message while offline",
              error,
            );
            reject(error);
          } else {
            debug("[raygun.ts] Stored message while offline");
            // Resolved value is null because message is stored
            resolve(null);
          }
        });
      });
    } else {
      // wrap Promise and add duration debug info
      const stopTimer = startTimer();
      // Use current transport to send request.
      // Transport can be batch or default.
      return this.transport()
        .send(sendOptions)
        .then((response) => {
          const durationInMs = stopTimer();
          debug(
            `[raygun.ts] Successfully sent message (duration=${durationInMs}ms)`,
          );
          return response;
        })
        .catch((error) => {
          const durationInMs = stopTimer();
          debug(
            `[raygun.ts] Error sending message (duration=${durationInMs}ms): ${error}`,
          );
          return error;
        });
    }
  }

  private reportUncaughtExceptions() {
    const [major, minor] = process.versions.node
      .split(".")
      .map((part) => parseInt(part, 10));

    if (
      major < 12 ||
      (major === 12 && minor < 17) ||
      (major === 13 && minor < 7)
    ) {
      console.log(
        "[Raygun4Node] Warning: reportUncaughtExceptions requires at least Node v12.17.0 or v13.7.0. Uncaught exceptions will not be automatically reported.",
      );

      return;
    }

    // Handles uncaught exceptions, e.g. missing try/catch on a throw.
    process.on("uncaughtExceptionMonitor", (e) => {
      this.sendSync(e, ["uncaughtException"]);
    });

    // Handles uncaught Promise rejections, e.g. missing .catch(...) on a Promise.
    // Unhandled Promise rejections are not caught by the "uncaughtExceptionMonitor".
    process.on("unhandledRejection", (reason, promise) => {
      if (reason instanceof Error || typeof reason === "string") {
        this.sendSync(reason, ["unhandledRejection"]);
      } else {
        // `reason` type is unknown, wrap in String
        this.sendSync(`Unhandled Rejection: ${reason}`, ["unhandledRejection"]);
      }
    });
  }

  /**
   * Send error using synchronous transport.
   * Only used internally to report uncaught exceptions or unhandled promises.
   * @param exception - error to report
   * @param tags - optional tags
   */
  private sendSync(exception: Error | string, tags?: Tag[]): void {
    const result = this.buildSendOptions(exception, null, undefined, tags);

    if (result.valid) {
      if (result.skip) {
        console.log(
          `[Raygun4Node] Skip sending message: ${result.message.details.error}.`,
        );
        return;
      }
      raygunSyncTransport.send(result.options);
    }
  }

  /**
   * Attach as express middleware to create a breadcrumb store scope per request.
   * e.g. `app.use(raygun.expressHandlerBreadcrumbs);`
   * Then call to `raygun.addBreadcrumb(...)` to add breadcrumbs to the future Raygun `send` call.
   * @param req - Express Request
   * @param res - Express response
   * @param next - Next Express function
   */
  expressHandlerBreadcrumbs(req: Request, res: Response, next: NextFunction) {
    breadcrumbs.runWithBreadcrumbs(() => {
      addRequestBreadcrumb(req);
      // Make the current breadcrumb store available to the express error handler
      res.locals.breadcrumbs = breadcrumbs.getBreadcrumbs();
      next();
    });
  }

  /**
   * Attach as express middleware to report application errors to Raygun automatically.
   * e.g. `app.use(raygun.expressHandler);`
   * @param err - Captured Error by Express
   * @param req - Express Request
   * @param res - Express response
   * @param next - Next Express function
   */
  expressHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    let customData;

    if (typeof this.expressCustomData === "function") {
      customData = this.expressCustomData(err, req);
    } else {
      customData = this.expressCustomData;
    }

    // Convert the Express Request to an object that can be sent to Raygun
    const requestParams: RequestParams = {
      hostname: req.hostname,
      path: req.path,
      method: req.method,
      ip: req.ip ?? "",
      query: req.query,
      headers: req.headers,
      body: req.body,
    };

    const sendParams = {
      customData: customData || {},
      request: requestParams,
      tags: ["UnhandledException"],
    };

    // If a local store of breadcrumbs exist in the response
    // run in scoped breadcrumbs store
    if (res.locals && res.locals.breadcrumbs) {
      breadcrumbs.runWithBreadcrumbs(() => {
        debug("sending express error with scoped breadcrumbs store");
        this.send(err, sendParams).catch((err) => {
          console.error("[Raygun] Failed to send Express error", err);
        });
      }, res.locals.breadcrumbs);
    } else {
      debug("sending express error with global breadcrumbs store");
      // Otherwise, run with the global breadcrumbs store
      this.send(err, sendParams)
        .then((response) => {
          // Clear global breadcrumbs store after successful sent
          breadcrumbs.clear();
        })
        .catch((err) => {
          console.error("[Raygun] Failed to send Express error", err);
        });
    }

    next(err);
  }

  stop() {
    if (this._batchTransport) {
      debug("[raygun.ts] Batch transport stopped");
      this._batchTransport.stopProcessing();
    }
  }

  private buildSendOptions(
    exception: Error | string,
    customData?: CustomData,
    request?: RequestParams,
    tags?: Tag[],
    timestamp?: Date,
    userInfo?: UserMessageData,
  ): SendOptionsResult {
    let mergedTags: Tag[] = [];
    let skip = false;

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
      timestamp: timestamp,
    })
      .setErrorDetails(exception)
      .setRequestDetails(request)
      .setMachineName()
      .setEnvironmentDetails()
      .setUserCustomData(customData)
      .setUser(userInfo || this.user(request) || this._user)
      .setVersion(this._version)
      .setBreadcrumbs(breadcrumbs.getBreadcrumbs())
      .setTags(mergedTags);

    let message = builder.build();

    if (this._groupingKey) {
      message.details.groupingKey =
        typeof this._groupingKey === "function"
          ? this._groupingKey(message, exception, customData, request, tags)
          : null;
    }

    if (this._onBeforeSend && typeof this._onBeforeSend === "function") {
      const _message = this._onBeforeSend(
        message,
        exception,
        customData,
        request,
        tags,
      );
      if (_message) {
        message = _message;
      } else {
        debug("[raygun.ts] onBeforeSend returned null, cancelling send");
        skip = true;
      }
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

    return {
      valid: true,
      message,
      skip: skip,
      options: {
        message: JSON.stringify(message),
        http: {
          host: this._host,
          port: this._port,
          useSSL: !!this._useSSL,
          apiKey: apiKey,
          ...(!this._batch && { timeout: this._timeout || DEFAULT_TIMEOUT }), // This can be called in batch mode, where t/o is unwanted, so only set if batch is enabled
        },
      },
    };
  }

  private offlineTransport(): MessageTransport {
    const transport = this.transport();
    const httpOptions = {
      host: this._host,
      port: this._port,
      useSSL: this._useSSL || false,
      apiKey: this._apiKey || "",
      ...(!this._batch && { timeout: this._timeout || DEFAULT_TIMEOUT }), // This can be called in batch mode, where t/o is unwanted, so only set if batch is enabled
    };

    return {
      send(message: string) {
        transport
          .send({
            message,
            http: httpOptions,
          })
          .then((response) => {
            debug(
              `[raygun.ts] Sent message from offline transport: ${response}`,
            );
          })
          .catch((error) => {
            console.error(
              "[Raygun4Node] Failed to send message from offline transport",
              error,
            );
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
      this.offlineTransport(),
    );

    return storage;
  }
}

export const Client = Raygun;
export type Client = Raygun;
export default { Client };
