/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

"use strict";

import fs from "fs";
import path from "path";
import * as raygunTransport from "./raygun.transport";
import {
  MessageTransport,
  IOfflineStorage,
  OfflineStorageOptions,
} from "./types";

const debug = require("debug")("raygun");

export class OfflineStorage implements IOfflineStorage {
  cachePath: string = "";
  cacheLimit: number = 100;
  transport: MessageTransport;

  constructor(transport: MessageTransport) {
    this.transport = transport;
  }

  private _sendAndDelete(item: string) {
    fs.readFile(path.join(this.cachePath, item), "utf8", (
      err,
      cacheContents
    ) => {
      this.transport.send(cacheContents);
      fs.unlink(path.join(this.cachePath, item), () => {});
    });
  }

  init(offlineStorageOptions: OfflineStorageOptions | undefined) {
    if (!offlineStorageOptions || !offlineStorageOptions.cachePath) {
      throw new Error("Cache Path must be set before Raygun can cache offline");
    }

    this.cachePath = offlineStorageOptions.cachePath;
    this.cacheLimit = offlineStorageOptions.cacheLimit || 100;

    debug(
      `offline storage - initialized (cachePath=${this.cachePath}, cacheLimit=${this.cacheLimit}`
    );

    if (!fs.existsSync(this.cachePath)) {
      fs.mkdirSync(this.cachePath);
    }

    return this;
  }

  save(transportItem: string, callback: (err: Error | null) => void) {
    const filename = path.join(this.cachePath, Date.now() + ".json");

    fs.readdir(this.cachePath, (err, files) => {
      if (err) {
        console.log("[Raygun] Error reading cache folder");
        console.log(err);
        return callback(err);
      }

      if (files.length > this.cacheLimit) {
        console.log("[Raygun] Error cache reached limit");
        return callback(null);
      }

      fs.writeFile(filename, transportItem, "utf8", function (err) {
        if (!err) {
          debug(`offline storage - wrote message to ${filename}`);
          return callback(null);
        }

        console.log("[Raygun] Error writing to cache folder");
        console.log(err);

        return callback(err);
      });
    });
  }

  retrieve(
    callback: (error: NodeJS.ErrnoException | null, items: string[]) => void
  ) {
    fs.readdir(this.cachePath, callback);
  }

  send(callback: (error: Error | null, items?: string[]) => void) {
    this.retrieve((err, items) => {
      if (err) {
        console.log("[Raygun] Error reading cache folder");
        console.log(err);
        return callback(err);
      }

      if (items.length > 0) {
        debug(
          "offline storage - transporting ${items.length} message(s) from cache"
        );
      }

      for (let i = 0; i < items.length; i++) {
        this._sendAndDelete(items[i]);
      }

      callback(err, items);
    });
  }
}
