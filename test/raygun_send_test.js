'use strict'

const test = require('tap').test
const semver = require('semver')
const VError = require('verror')
const nock = require('nock')

const Raygun = require('../lib/raygun.ts')

nock(/.*/)
  .post(/.*/, function () {
    return true
  })
  .reply(202, {})
  .persist()
const API_KEY = 'apikey'

test('send basic', {}, function (t) {
  t.plan(1)

  if (semver.satisfies(process.version, '=0.10')) {
    t.pass('Ignored on node 0.10')
    t.end()
    return
  }

  const client = new Raygun.Client().init({
    apiKey: API_KEY
  })
  client.send(new Error(), {}, function (response) {
    t.equal(response.statusCode, 202)
    t.end()
  })
})

test('send complex', {}, function (t) {
  t.plan(1)

  if (semver.satisfies(process.version, '=0.10')) {
    t.pass('Ignored on node 0.10')
    t.end()
    return
  }

  const client = new Raygun.Client()
    .init({ apiKey: API_KEY })
    .setUser('callum@mindscape.co.nz')
    .setVersion('1.0.0.0')

  client.send(new Error(), {}, function (response) {
    t.equal(response.statusCode, 202)
    t.end()
  })
})

test('send with inner error', {}, function (t) {
  t.plan(1)

  if (semver.satisfies(process.version, '=0.10')) {
    t.pass('Ignored on node 0.10')
    t.end()
    return
  }

  const error = new Error('Outer')
  const innerError = new Error('Inner')

  error.cause = function () {
    return innerError
  }

  const client = new Raygun.Client().init({
    apiKey: API_KEY
  })
  client.send(error, {}, function (response) {
    t.equal(response.statusCode, 202)
    t.end()
  })
})

test('send with verror', {}, function (t) {
  t.plan(1)

  if (semver.satisfies(process.version, '=0.10')) {
    t.pass('Ignored on node 0.10')
    t.end()
    return
  }

  const error = new VError(
    new VError(new VError('Deep Error'), 'Inner Error'),
    'Outer Error'
  )

  const client = new Raygun.Client().init({
    apiKey: API_KEY
  })
  client.send(error, {}, function (response) {
    t.equal(response.statusCode, 202)
    t.end()
  })
})

test('send with OnBeforeSend', {}, function (t) {
  t.plan(1)

  if (semver.satisfies(process.version, '=0.10')) {
    t.pass('Ignored on node 0.10')
    t.end()
    return
  }

  const client = new Raygun.Client().init({
    apiKey: API_KEY
  })

  let onBeforeSendCalled = false
  client.onBeforeSend(function (payload) {
    onBeforeSendCalled = true
    return payload
  })

  client.send(new Error(), {}, function () {
    t.equal(onBeforeSendCalled, true)
    t.end()
  })
})

test('send with expressHandler custom data', function (t) {
  t.plan(1)
  const client = new Raygun.Client().init({
    apiKey: API_KEY
  })

  client.expressCustomData = function () {
    return { test: 'data' }
  }
  client._send = client.send
  client.send = function (err, data) {
    client.send = client._send
    t.equal(data.test, 'data')
    t.end()
  }
  client.expressHandler(new Error(), {}, {}, function () {})
})

test('check that tags get passed through', {}, function (t) {
  const tag = ['Test']
  const client = new Raygun.Client().init({ apiKey: 'TEST' })

  client.setTags(tag)

  client.onBeforeSend(function (payload) {
    t.same(payload.details.tags, tag)
    return payload
  })

  client.send(new Error(), {}, function () {
    t.end()
  })
})

test('check that tags get merged', {}, function (t) {
  const client = new Raygun.Client().init({ apiKey: 'TEST' })
  client.setTags(['Tag1'])

  client.onBeforeSend(function (payload) {
    t.same(payload.details.tags, ['Tag1', 'Tag2'])
    return payload
  })

  client.send(
    new Error(),
    {},
    function () {
      t.end()
    },
    null,
    ['Tag2']
  )
})
