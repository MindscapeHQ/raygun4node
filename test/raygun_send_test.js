'use strict';

var test = require("tap").test;
var Raygun = require('../lib/raygun.js');

// need to get these working, they time out for some reason, despite the call succeeding

test('send basic', {skip: true}, function (t) {
  t.plan(1);
  var client = new Raygun.Client().init({apiKey: process.env['RAYGUN_APIKEY']});
  client.send(new Error(), {}, function (response) {
    t.equals(response.statusCode, 202);
  });
});

test('send complex', {skip: true}, function (t) {
  t.plan(1);
  var client = new Raygun.Client().init({apiKey: process.env['RAYGUN_APIKEY']}).setUser("callum@mindscape.co.nz").setVersion("1.0.0.0");

  client.send(new Error(), {}, function (response) {
    t.equals(response.statusCode, 202);
  });
});

test('send with OnBeforeSend', {skip: true}, function (t) {
  t.plan(1);
  var client = new Raygun.Client().init({apiKey: process.env['RAYGUN_APIKEY']});

  var onBeforeSendCalled = false;
  client.onBeforeSend(function(payload){
    return payload;
  });

  client.send(new Error(), {}, function () {
    t.equals(onBeforeSendCalled, true);
    t.end();
  });
});