/*jshint unused:vars */

/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

'use strict';

import fs from 'fs';
import path from 'path';
import * as raygunTransport from './raygun.transport';
import {OfflineStorageOptions} from './types';

type TransportItem = {
  callback?: Function;
}

export class OfflineStorage {
  cachePath: string = "";
  cacheLimit: number = 100;

  private _sendAndDelete(item: string) {
    const storage = this;

    fs.readFile(
        path.join(this.cachePath, item),
        'utf8',
        function(err, cacheContents) {
          raygunTransport.send(JSON.parse(cacheContents));
          fs.unlink(path.join(storage.cachePath, item), () => {});
        }
    );
  }

  init(offlineStorageOptions: OfflineStorageOptions | undefined) {
    if (!offlineStorageOptions || !offlineStorageOptions.cachePath) {
      throw new Error("Cache Path must be set before Raygun can cache offline");
    }

    this.cachePath = offlineStorageOptions.cachePath;
    this.cacheLimit = offlineStorageOptions.cacheLimit || 100;

    if (!fs.existsSync(this.cachePath)) {
      fs.mkdirSync(this.cachePath);
    }

    return this;
  };

  save(transportItem: TransportItem, callback: (err: Error | null) => void) {
    const storage = this;

    var filename = path.join(storage.cachePath, Date.now() + '.json');
    delete transportItem.callback;

    if (!callback) {
      callback = function() {};
    }

    fs.readdir(storage.cachePath, function(err, files) {
      if (err) {
        console.log("[Raygun] Error reading cache folder");
        console.log(err);
        return callback(err);
      }

      if (files.length > storage.cacheLimit) {
        console.log("[Raygun] Error cache reached limit");
        return callback(null);
      }

      fs.writeFile(filename, JSON.stringify(transportItem), 'utf8',
        function(err) {
          if (!err) {
            return callback(null);
          }

          console.log("[Raygun] Error writing to cache folder");
          console.log(err);

          return callback(err);
        });
    });
  };

  retrieve(callback: (error: NodeJS.ErrnoException | null, items: string[]) => void) {
    fs.readdir(this.cachePath, callback);
  };

  send(callback: (error: Error | null, items?: string[]) => void) {
    const storage = this;

    if (!callback) {
      callback = function() {};
    }

    storage.retrieve(function(err, items) {
      if (err) {
        console.log("[Raygun] Error reading cache folder");
        console.log(err);
        return callback(err);
      }

      for (var i = 0; i < items.length; i++) {
        storage._sendAndDelete(items[i]);
      }

      callback(err, items);
    });
  };
};
