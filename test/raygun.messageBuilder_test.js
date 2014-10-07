'use strict';

var test = require("tap").test;
var MessageBuilder = require('../lib/raygun.messageBuilder.js');

test('basic builder tests', function (t) {
  var builder = new MessageBuilder();
  var message = builder.build();

  t.test('messageBuild', function (tt) {
    tt.ok(message);
    tt.end();
  });

  t.test('occurred on', function (tt) {
    tt.ok(message.occurredOn);
    tt.end();
  });

  t.test('details', function (tt) {
    tt.ok(message.details);
    tt.end();
  });
  
  t.test('client details', function (tt) {
    tt.ok(message.details.client);
    tt.ok(message.details.client.name);
    tt.ok(message.details.client.version);
    tt.end();
  });
  
  t.test('machine name', function (tt) {
    var builder = new MessageBuilder();
    builder.setMachineName('server1');
    var message = builder.build();
    tt.equals(message.details.machineName, 'server1');
    tt.end();
  });
  
  t.test('default machine name', function (tt) {
    var builder = new MessageBuilder();
    builder.setMachineName();
    var message = builder.build();
    tt.ok(message.details.machineName);
    tt.end();
  });
  
  t.end();
});

test('error builder tests', function (t) {
  var builder = new MessageBuilder();
  builder.setErrorDetails(new Error());
  var message = builder.build();
  
  t.test('error', function (tt) {
    tt.ok(message.details.error);
    tt.end();
  });
  
  t.test('stack trace', function (tt) {
    tt.ok(message.details.error.stackTrace);
    tt.equal(message.details.error.stackTrace.length, 8);
    tt.end();
  });
  
  t.test('stack trace correct', function (tt) {
    var stackTrace = message.details.error.stackTrace;
    stackTrace.forEach(function (stackTraceLine) {
      tt.ok(stackTraceLine.lineNumber);
      tt.ok(stackTraceLine.className);
      tt.ok(stackTraceLine.fileName);
      tt.ok(stackTraceLine.methodName);
    });
    tt.end();
  });
  
  t.test('error message correct', function (tt) {
    var errorMessage = 'WarpCoreAlignment';
    var builder = new MessageBuilder();
    builder.setErrorDetails(new Error(errorMessage));
    var message = builder.build();
    tt.ok(message.details.error.message);
    tt.equals(message.details.error.message, errorMessage);
    tt.end();
  });
  
  t.test('default error message correct', function (tt) {
    tt.ok(message.details.error.message);
    tt.equals(message.details.error.message, 'NoMessage');
    tt.end();
  });
  
  t.test('class name correct', function (tt) {
    tt.ok(message.details.error.className);
    tt.equals(message.details.error.className, 'Error');
    tt.end();
  });
});

test('environment builder', function (t) {
  var builder = new MessageBuilder();
  builder.setEnvironmentDetails();
  var message = builder.build();
  
  var properties = ['processorCount', 'osVersion', 'cpu', 'architecture', 'totalPhysicalMemory', 'availablePhysicalMemory', 'utcOffset'];
  
  t.plan(properties.length + 1);
  
  t.ok(message.details.environment);
  
  properties.forEach(function (i) {
    t.ok(message.details.environment[i], i + ' should be set');
  });
});

test('custom data builder', function (t) {
  
  t.test('custom data is set', function (tt) {
    var builder = new MessageBuilder();
    builder.setUserCustomData({ foo: 'bar' });
    var message = builder.build();
  
    tt.ok(message.details.userCustomData);
    tt.equals(message.details.userCustomData.foo, 'bar');
    
    tt.end();
  });

  t.test('allow empty custom data', function (tt) {
    var builder = new MessageBuilder();
    builder.setUserCustomData();
    var message = builder.build();
    tt.equals(message.details.userCustomData, undefined);
    tt.end();
  });
  
  t.end();
});

test('express request builder', function (t) {
  var builder = new MessageBuilder();
  builder.setRequestDetails({ host: 'localhost' });
  var message = builder.build();
  
  t.ok(message.details.request.hostName);
  t.end();
});

test('user and version builder tests', function (t) {
  t.test('simple user', function (tt) {
    var builder = new MessageBuilder();
    builder.setUser('testuser');
    var message = builder.build();
    tt.equals(message.details.user.identifier, 'testuser');
    tt.end();
  });
  
  t.test('user function', function (tt) {
    var builder = new MessageBuilder();
    builder.setUser(function() { return 'testuser'; });
    var message = builder.build();
    tt.equals(message.details.user.identifier, 'testuser');
    tt.end();
  });
  
  t.test('version set', function (tt) {
    var builder = new MessageBuilder();
    builder.setVersion('1.0.0.0');
    var message = builder.build();
    tt.equals(message.details.version, '1.0.0.0');
    tt.end();
  });
  
  t.end();
});
