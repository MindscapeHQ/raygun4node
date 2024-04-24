'use strict'

const test = require('tap').test
const Raygun = require('../lib/raygun.ts')

const options = {
  apiKey: process.env.RAYGUN_APIKEY
}

test('init', function (t) {
  t.ok(new Raygun.Client().init(options))
  t.end()
})

test('user', function (t) {
  const client = new Raygun.Client().init(options)

  client.user = function (req) {
    return req.user
  }

  const req = {
    user: 'theuser'
  }

  t.equal(client.user(req), 'theuser')
  t.end()
})
