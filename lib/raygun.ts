/*jshint unused:vars */

/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

"use strict";

import type {
  RawUserData,
  OfflineStorageOptions,
  Tag,
  CustomData,
  RequestParams,
  Message,
} from "./types";
import type { Request, Response, NextFunction } from "express";
import * as raygunTransport from "./raygun.transport";
import { RaygunMessageBuilder } from "./raygun.messageBuilder";
import { OfflineStorage } from "./raygun.offline";

type SendCB = (error: Error | null, items: string[] | undefined) => void;

type BeforeSendCB = (
  message: Message,
  exception: Error | string,
  customData: CustomData,
  request?: RequestParams,
  tags?: Tag[]
) => Message;

type RaygunOptions = {
  apiKey: string;
  filters?: string[];
  host?: string;
  port?: number;
  useSSL?: boolean;
  onBeforeSend?: BeforeSendCB;
  offlineStorage?: OfflineStorage;
  offlineStorageOptions?: OfflineStorageOptions;
  isOffline?: boolean;
  groupingKey?: Function;
  tags?: Tag[];
  useHumanStringForObject?: boolean;
  reportColumnNumbers?: boolean;
  innerErrorFieldName?: string;
};

class Raygun {
  _apiKey: string | undefined;
  _filters: string[] = [];
  _user: RawUserData | undefined;
  _version: string = "";
  _host: string | undefined;
  _port: number | undefined;
  _useSSL: boolean | undefined;
  _onBeforeSend: BeforeSendCB | undefined;
  _offlineStorage: OfflineStorage | undefined;
  _isOffline: boolean | undefined;
  _offlineStorageOptions: OfflineStorageOptions | undefined;
  _groupingKey: Function | undefined; // TODO
  _tags: Tag[] | undefined;
  _useHumanStringForObject: boolean | undefined;
  _reportColumnNumbers: boolean | undefined;
  _innerErrorFieldName: string | undefined;

  init(options: RaygunOptions) {
    this._apiKey = options.apiKey;
    this._filters = options.filters || [];
    this._host = options.host;
    this._port = options.port;
    this._useSSL = options.useSSL !== false;
    this._onBeforeSend = options.onBeforeSend;
    this._offlineStorage = options.offlineStorage || new OfflineStorage(); // TODO - TypeScript only allows typesafe `new` use with TS
    this._offlineStorageOptions = options.offlineStorageOptions;
    this._isOffline = options.isOffline;
    this._groupingKey = options.groupingKey;
    this._tags = options.tags;
    this._useHumanStringForObject =
      options.useHumanStringForObject === undefined
        ? true
        : options.useHumanStringForObject;
    this._reportColumnNumbers = options.reportColumnNumbers;
    this._innerErrorFieldName = options.innerErrorFieldName; // VError function to retrieve inner error;

    this.expressHandler = this.expressHandler.bind(this);

    if (this._isOffline) {
      this._offlineStorage.init(this._offlineStorageOptions);
    }

    return this;
  }

  user(req: Request): RawUserData | null {
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

  onBeforeSend(onBeforeSend: BeforeSendCB) {
    this._onBeforeSend = onBeforeSend;
    return this;
  }

  groupingKey(groupingKey: Function) {
    this._groupingKey = groupingKey;
    return this;
  }

  offline() {
    this.offlineStorage().init(this._offlineStorageOptions);
    this._isOffline = true;
  }

  online(callback: SendCB) {
    this._isOffline = false;
    this.offlineStorage().send(callback);
  }

  setTags(tags: Tag[]) {
    this._tags = tags;
  }

  send(
    exception: Error | string,
    customData: CustomData,
    callback: (err: Error | null) => void,
    request?: Request,
    tags?: Tag[]
  ): Message {
    var mergedTags: Tag[] = [];

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
      innerErrorFieldName: this._innerErrorFieldName || "cause",
    })
      .setErrorDetails(exception)
      .setRequestDetails(request)
      .setMachineName()
      .setEnvironmentDetails()
      .setUserCustomData(customData)
      .setUser((request && this.user(request)) || this._user)
      .setVersion(this._version)
      .setTags(mergedTags);

    var message = builder.build();

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

    const apiKey = this._apiKey;

    if (!apiKey) {
      console.error(
        `Encountered an error sending an error to Raygun. No API key is configured, please ensure .init is called with api key. See docs for more info.`
      );
      return message;
    }

    const transportMessage = {
      message: message,
      apiKey: apiKey,
      callback: callback,
      host: this._host,
      port: this._port,
      useSSL: this._useSSL || false,
    };

    if (this._isOffline) {
      this.offlineStorage().save(transportMessage, callback);
    } else {
      raygunTransport.send(transportMessage);
    }

    return message;
  }

  expressHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    var customData;

    if (typeof this.expressCustomData === "function") {
      customData = this.expressCustomData(err, req);
    } else {
      customData = this.expressCustomData;
    }

    this.send(err, customData || {}, function () {}, req);
    next();
  }

  private offlineStorage(): OfflineStorage {
    let storage = this._offlineStorage;

    if (!storage) {
      storage = this._offlineStorage = new OfflineStorage();
    }

    return storage;
  }
}

export const Client = Raygun;
