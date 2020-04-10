/*jshint unused:vars */

/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

'use strict';

import type { RawUserData, OfflineStorageOptions, Tag, CustomData, RequestParams, Message } from "./types";
import type { Request, Response, NextFunction } from 'express';
import * as raygunTransport from './raygun.transport';
import {RaygunMessageBuilder} from './raygun.messageBuilder';
import {OfflineStorage} from './raygun.offline';

type SendCB = (error: Error | null, items: string[] | undefined) => void;
type BeforeSendCB = (message: Message, exception: Error | string, customData: CustomData, request?: RequestParams, tags?: Tag[]) => Message;

type RaygunClient = {
    init(options: RaygunOptions): RaygunClient;
    user(req: Request): RawUserData | null;
    setUser(user: RawUserData): RaygunClient;
    expressCustomData: ((error: Error, request: Request) => CustomData) | CustomData;
    setVersion(version: string): RaygunClient;
    onBeforeSend(f: BeforeSendCB): RaygunClient;
    groupingKey(key: Function): RaygunClient;
    offline(): void;
    online(cb: SendCB): void;
    setTags(tags: Tag[]): void;
    send(exception: Error | string, customData: CustomData, callback: (err: Error | null) => void, request?: Request, tags?: Tag[]): Message;
    expressHandler(error: Error, req: Request, res: Response, next: NextFunction): void;
}

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
    innerErrorFieldName: string;
}

type Payload = {};

var Raygun = function (this: RaygunClient) {
    const raygun = this;
    let _apiKey: string;
    let _filters: string[];
    let _user: RawUserData;
    let _version: string;
    let _host: string | undefined;
    let _port: number | undefined;
    let _useSSL: boolean;
    let _onBeforeSend: BeforeSendCB | undefined;
    let _offlineStorage: OfflineStorage;
    let _isOffline: boolean | undefined;
    let _offlineStorageOptions: OfflineStorageOptions | undefined;
    let _groupingKey: Function | undefined; // TODO
    let _tags: Tag[] | undefined;
    let _useHumanStringForObject: boolean;
    let _reportColumnNumbers: boolean | undefined;
    let _innerErrorFieldName: string;

    raygun.init = function (options: RaygunOptions) {
        _apiKey = options.apiKey;
        _filters = options.filters || [];
        _host = options.host;
        _port = options.port;
        _useSSL = options.useSSL !== false;
        _onBeforeSend = options.onBeforeSend;
        _offlineStorage = options.offlineStorage || new OfflineStorage(); // TODO - TypeScript only allows typesafe `new` use with TS
        _offlineStorageOptions = options.offlineStorageOptions;
        _isOffline = options.isOffline;
        _groupingKey = options.groupingKey;
        _tags = options.tags;
        _useHumanStringForObject = options.useHumanStringForObject === undefined ? true : options.useHumanStringForObject;
        _reportColumnNumbers = options.reportColumnNumbers;
        _innerErrorFieldName = options.innerErrorFieldName || 'cause'; // VError function to retrieve inner error;

        if (_isOffline) {
            _offlineStorage.init(_offlineStorageOptions);
        }

        return raygun;
    };

    raygun.user = function (req: RequestParams) {
        return null;
    };

    // This function is deprecated, is provided for legacy apps and will be
    // removed in 1.0: use raygun.user instead
    raygun.setUser = function (user) {
        _user = user;
        return raygun;
    };

    raygun.expressCustomData = function () {
        return {};
    };

    raygun.setVersion = function (version) {
        _version = version;
        return raygun;
    };

    raygun.onBeforeSend = function (onBeforeSend) {
        _onBeforeSend = onBeforeSend;
        return raygun;
    };

    raygun.groupingKey = function (groupingKey) {
        _groupingKey = groupingKey;
        return raygun;
    };

    raygun.offline = function () {
        _offlineStorage.init(_offlineStorageOptions);
        _isOffline = true;
    };

    raygun.online = function (callback) {
        _isOffline = false;
        _offlineStorage.send(callback);
    };

    raygun.setTags = function (tags) {
        _tags = tags;
    };

    raygun.send = function (exception, customData, callback, request, tags) {
        var mergedTags: Tag[] = [];

        if (_tags) {
            mergedTags = mergedTags.concat(_tags);
        }

        if (tags) {
            mergedTags = mergedTags.concat(tags);
        }

        var builder = new RaygunMessageBuilder({filters: _filters, useHumanStringForObject: _useHumanStringForObject, reportColumnNumbers: _reportColumnNumbers, innerErrorFieldName: _innerErrorFieldName})
            .setErrorDetails(exception)
            .setRequestDetails(request)
            .setMachineName()
            .setEnvironmentDetails()
            .setUserCustomData(customData)
            .setUser((request && raygun.user(request)) || _user)
            .setVersion(_version)
            .setTags(mergedTags);

        var message = builder.build();

        if (_groupingKey) {
            message.details.groupingKey = typeof _groupingKey === 'function' ? _groupingKey(message, exception, customData, request, tags) : null;
        }

        if (_onBeforeSend) {
            message = typeof _onBeforeSend === 'function' ? _onBeforeSend(message, exception, customData, request, tags) : message;
        }

        var transportMessage = {
            message: message,
            apiKey: _apiKey,
            callback: callback,
            host: _host,
            port: _port,
            useSSL: _useSSL
        };

        if (_isOffline) {
            _offlineStorage.save(transportMessage, callback);
        } else {
            raygunTransport.send(transportMessage);
        }

        return message;
    };

    raygun.expressHandler = function (err, req, res, next) {
        var customData;

        if (typeof raygun.expressCustomData === 'function') {
            customData = raygun.expressCustomData(err, req);
        } else {
            customData = raygun.expressCustomData;
        }

        raygun.send(err, customData || {}, function () {}, req);
        next();
    };
};

exports.Client = Raygun;
