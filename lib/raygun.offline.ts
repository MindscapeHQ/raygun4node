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

type OfflineStorage = {
  cachePath: string;
  cacheLimit: number;

  init(offlineStorageOptions: OfflineStorageOptions): OfflineStorage;
  save(transportItem: TransportItem, callback: (err: Error | null) => void): void;
  retrieve(cb: (error: NodeJS.ErrnoException | null, items: string[]) => void): void;
  send(cb: (error: Error | null, items?: string[]) => void): void;
}

var OfflineStorage = function(this: OfflineStorage) {
  var storage = this;

  function _sendAndDelete(item: string) {
    fs.readFile(
        path.join(storage.cachePath, item),
        'utf8',
        function(err, cacheContents) {
          raygunTransport.send(JSON.parse(cacheContents));
          fs.unlink(path.join(storage.cachePath, item), () => {});
        }
    );
  }

  storage.init = function(offlineStorageOptions) {
    if (offlineStorageOptions && !offlineStorageOptions.cachePath) {
      throw new Error("Cache Path must be set before Raygun can cache offline");
    }

    storage.cachePath = offlineStorageOptions.cachePath;
    storage.cacheLimit = offlineStorageOptions.cacheLimit || 100;

    if (!fs.existsSync(storage.cachePath)) {
      fs.mkdirSync(storage.cachePath);
    }

    return storage;
  };

  storage.save = function(transportItem, callback) {
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

  storage.retrieve = function(callback) {
    fs.readdir(storage.cachePath, callback);
  };

  storage.send = function(callback) {
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
        _sendAndDelete(items[i]);
      }

      callback(err, items);
    });
  };
};

exports = module.exports = OfflineStorage;
