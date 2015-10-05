/*jshint unused:vars */

/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var raygunTransport = require('./raygun.transport');

var OfflineStorage = function() {
    var storage = this;

    storage.init = function(cachePath) {
        storage.cachePath = cachePath;

        if (!fs.existsSync(storage.cachePath)) {
            fs.mkdirSync(storage.cachePath);
        }

        return storage;
    };

    storage.save = function(transportItem, callback) {
        var filename = path.join(storage.cachePath, Date.now() + '.json');
        delete transportItem.callback;

        fs.writeFile(filename, JSON.stringify(transportItem), 'utf8', callback);
    };

    storage.retrieve = function(callback) {
        fs.readdir(storage.cachePath, callback);
    };

    storage.send = function(callback) {
        storage.retrieve(function(err, items) {
            for (var i = 0; i < items.length; i++) {
                _sendAndDelete(items[i]);
            }

            if (callback) {
                callback(err, items);
            }
        });
    };

    function _sendAndDelete(item) {
        fs.readFile(path.join(storage.cachePath, item), 'utf8', function(err, cacheContents) {
            raygunTransport.send(JSON.parse(cacheContents));
            fs.unlink(path.join(storage.cachePath, item));
        });
    }
};

exports = module.exports = OfflineStorage;