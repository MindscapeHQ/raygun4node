'use strict'

const deepEqual = require('assert').deepEqual
const test = require('tap').test
const MessageBuilder = require('../lib/raygun.messageBuilder.ts')
  .RaygunMessageBuilder
const VError = require('verror')

test('basic builder tests', function (t) {
  const builder = new MessageBuilder()
  const message = builder.build()

  t.test('messageBuild', function (tt) {
    tt.ok(message)
    tt.end()
  })

  t.test('occurred on', function (tt) {
    tt.ok(message.occurredOn)
    tt.end()
  })

  t.test('details', function (tt) {
    tt.ok(message.details)
    tt.end()
  })

  t.test('client details', function (tt) {
    tt.ok(message.details.client)
    tt.ok(message.details.client.name)
    tt.ok(message.details.client.version)
    tt.end()
  })

  t.test('machine name', function (tt) {
    const builder = new MessageBuilder()
    builder.setMachineName('server1')
    const message = builder.build()
    tt.equal(message.details.machineName, 'server1')
    tt.end()
  })

  t.test('default machine name', function (tt) {
    const builder = new MessageBuilder()
    builder.setMachineName()
    const message = builder.build()
    tt.ok(message.details.machineName)
    tt.end()
  })

  t.test('humanise error string', function (tt) {
    const builder = new MessageBuilder({ useHumanStringForObject: true })
    builder.setErrorDetails({ name: 'Test' })

    const message = builder.build()
    tt.ok(message.details.error.message)
    tt.equal('name=Test', message.details.error.message)
    tt.ok(message.details.groupingKey)
    tt.end()
  })

  t.test('humanise leaves strings intact', function (tt) {
    const builder = new MessageBuilder({ useHumanStringForObject: true })
    builder.setErrorDetails('my awesome error')

    const message = builder.build()
    tt.notOk(message.details.groupingKey)
    tt.equal('my awesome error', message.details.error.message)
    tt.end()
  })

  t.test('dont humanise string', function (tt) {
    const builder = new MessageBuilder({ useHumanStringForObject: false })
    builder.setErrorDetails({ name: 'Test' })

    const message = builder.build()
    tt.notOk(message.details.groupingKey)
    tt.equal('NoMessage', message.details.error.message)
    tt.end()
    t.end()
  })
})

test('error builder tests', function (t) {
  const builder = new MessageBuilder()
  builder.setErrorDetails(new Error())
  const message = builder.build()

  t.test('error', function (tt) {
    tt.ok(message.details.error)
    tt.end()
  })

  t.test('stack trace correct', function (tt) {
    const stackTrace = message.details.error.stackTrace
    stackTrace.forEach(function (stackTraceLine) {
      tt.ok(stackTraceLine.lineNumber)
      tt.ok(stackTraceLine.className)
      tt.ok(stackTraceLine.fileName)
      tt.ok(stackTraceLine.methodName)
    })
    tt.end()
  })

  t.test('error message correct', function (tt) {
    const errorMessage = 'WarpCoreAlignment'
    const builder = new MessageBuilder()
    builder.setErrorDetails(new Error(errorMessage))
    const message = builder.build()
    tt.ok(message.details.error.message)
    tt.equal(message.details.error.message, errorMessage)
    tt.end()
  })

  t.test('default error message correct', function (tt) {
    tt.ok(message.details.error.message)
    tt.equal(message.details.error.message, 'NoMessage')
    tt.end()
  })

  t.test('class name correct', function (tt) {
    tt.ok(message.details.error.className)
    tt.equal(message.details.error.className, 'Error')
    tt.end()
  })

  t.test('error from string', function (tt) {
    const errorMessage = 'WarpCoreAlignment'
    const builder = new MessageBuilder()
    builder.setErrorDetails(errorMessage)
    const message = builder.build()
    tt.ok(message.details.error.message)
    tt.equal(message.details.error.message, errorMessage)
    tt.end()
    t.end()
  })
})

test('inner error builder tests', function (t) {
  const innerErrorMessage = 'Inner'
  const innerInnerErrorMessage = 'InnerInner'

  const innerErrorFieldName = 'innerCause'

  const error = new Error('Outer')
  const innerError = new Error(innerErrorMessage)
  const innerInnerError = new Error(innerInnerErrorMessage)

  error[innerErrorFieldName] = function () {
    return innerError
  }

  innerError[innerErrorFieldName] = function () {
    return innerInnerError
  }

  const builder = new MessageBuilder({
    innerErrorFieldName
  })
  builder.setErrorDetails(error)
  const message = builder.build()

  t.test('inner errors', function (tt) {
    tt.ok(message.details.error.innerError)
    tt.ok(message.details.error.innerError.innerError)
    tt.notOk(message.details.error.innerError.innerError.innerError)

    tt.end()
  })

  t.test('inner stack traces correct', function (tt) {
    const stackTraces = [
      message.details.error.innerError.stackTrace,
      message.details.error.innerError.innerError.stackTrace
    ]

    stackTraces.forEach(function (stackTrace) {
      stackTrace.forEach(function (stackTraceLine) {
        tt.ok(stackTraceLine.lineNumber)
        tt.ok(stackTraceLine.className)
        tt.ok(stackTraceLine.fileName)
        tt.ok(stackTraceLine.methodName)
      })
    })
    tt.end()
  })

  t.test('inner errors messages correct', function (tt) {
    tt.ok(message.details.error.innerError.message)
    tt.ok(message.details.error.innerError.innerError.message)

    tt.equal(message.details.error.innerError.message, innerErrorMessage)
    tt.equal(
      message.details.error.innerError.innerError.message,
      innerInnerErrorMessage
    )

    tt.end()
    t.end()
  })
})

test('VError support', function (t) {
  const innerErrorMessage = 'Inner'
  const innerInnerErrorMessage = 'InnerInner'

  const error = new VError(
    new VError(new VError(innerInnerErrorMessage), innerErrorMessage),
    'Outer Error'
  )

  const builder = new MessageBuilder({ innerErrorFieldName: 'cause' })
  builder.setErrorDetails(error)
  const message = builder.build()

  t.test('inner errors', function (tt) {
    tt.ok(message.details.error.innerError)
    tt.ok(message.details.error.innerError.innerError)
    tt.notOk(message.details.error.innerError.innerError.innerError)

    tt.end()
  })

  t.end()
})

test('environment builder', function (t) {
  const builder = new MessageBuilder()
  builder.setEnvironmentDetails()
  const message = builder.build()

  // missing utcOffset for now as need to find a good way to test for its existence
  const properties = [
    'processorCount',
    'osVersion',
    'cpu',
    'architecture',
    'totalPhysicalMemory',
    'availablePhysicalMemory'
  ]

  t.plan(properties.length + 1)

  t.ok(message.details.environment)

  properties.forEach(function (i) {
    t.ok(message.details.environment[i], i + ' should be set')
  })
})

test('custom data builder', function (t) {
  t.test('custom data is set', function (tt) {
    const builder = new MessageBuilder()
    builder.setUserCustomData({ foo: 'bar' })
    const message = builder.build()

    tt.ok(message.details.userCustomData)
    tt.equal(message.details.userCustomData.foo, 'bar')

    tt.end()
  })

  t.test('allow empty custom data', function (tt) {
    const builder = new MessageBuilder()
    builder.setUserCustomData()
    const message = builder.build()
    tt.equal(message.details.userCustomData, undefined)
    tt.end()
    t.end()
  })
})

test('express4 request builder', function (t) {
  const builder = new MessageBuilder()
  builder.setRequestDetails({ hostname: 'localhost' })
  const message = builder.build()

  t.ok(message.details.request.hostName)
  t.end()
})

test('express3 request builder', function (t) {
  const builder = new MessageBuilder()
  builder.setRequestDetails({ host: 'localhost' })
  const message = builder.build()

  t.ok(message.details.request.hostName)
  t.end()
})

test('user and version builder tests', function (t) {
  t.test('simple user', function (tt) {
    const builder = new MessageBuilder()
    builder.setUser('testuser')
    const message = builder.build()
    tt.equal(message.details.user.identifier, 'testuser')
    tt.end()
  })

  t.test('user function', function (tt) {
    const builder = new MessageBuilder()
    builder.setUser(function () {
      return 'testuser'
    })
    const message = builder.build()
    tt.equal(message.details.user.identifier, 'testuser')
    tt.end()
  })

  t.test('user function returning object', function (tt) {
    const builder = new MessageBuilder()
    builder.setUser(function () {
      return {
        identifier: 'testuser',
        email: 'test@example.com',
        notSupportedProp: 'ignore'
      }
    })
    const message = builder.build()
    tt.equal(message.details.user.identifier, 'testuser')
    tt.equal(message.details.user.email, 'test@example.com')
    tt.equal(message.details.user.notSupportedProp, undefined)
    tt.end()
  })

  t.test('set user with object', function (tt) {
    const builder = new MessageBuilder()
    builder.setUser({
      identifier: 'testuser',
      email: 'test@example.com',
      notSupportedProp: 'ignore'
    })
    const message = builder.build()
    tt.equal(
      message.details.user.identifier,
      'testuser',
      'identifier should be set to the one in the object we returned from the user function'
    )
    tt.equal(
      message.details.user.email,
      'test@example.com',
      'email should be set to the one in the object we returned from the user function'
    )
    tt.equal(
      message.details.user.notSupportedProp,
      undefined,
      'should skip unknown properties'
    )
    tt.end()
  })

  t.test('version set', function (tt) {
    const builder = new MessageBuilder()
    builder.setVersion('1.0.0.0')
    const message = builder.build()
    tt.equal(message.details.version, '1.0.0.0')
    tt.end()
    t.end()
  })
})

test('filter keys tests', function (t) {
  const builder = new MessageBuilder({
    filters: ['username', 'password', 'X-ApiKey']
  })
  const body = {
    username: 'admin@raygun.io',
    password: 'nice try',
    remember: true
  }
  const queryString = { username: 'admin@raygun.io', remember: false }
  const headers = { 'X-ApiKey': '123456', Host: 'app.raygun.io' }
  builder.setRequestDetails({
    body,
    query: queryString,
    headers
  })
  const message = builder.build()

  t.test('form is filtered', function (tt) {
    tt.equal(message.details.request.form.username, undefined)
    tt.equal(message.details.request.form.password, undefined)
    tt.equal(message.details.request.form.remember, true)
    tt.end()
  })

  t.test('query string is filtered', function (tt) {
    tt.equal(message.details.request.queryString.username, undefined)
    tt.equal(message.details.request.queryString.password, undefined)
    tt.equal(message.details.request.queryString.remember, false)
    tt.end()
  })

  t.test('headers are filtered', function (tt) {
    tt.equal(message.details.request.headers['X-ApiKey'], undefined)
    tt.equal(message.details.request.headers.Host, 'app.raygun.io')
    tt.end()
    t.end()
  })
})

test('custom tags', function (t) {
  t.test('with array', function (tt) {
    const builder = new MessageBuilder()
    builder.setTags(['a', 'bb', 'c'])
    const message = builder.build()

    deepEqual(message.details.tags, ['a', 'bb', 'c'])
    tt.end()
  })

  t.test('with null', function (tt) {
    const builder = new MessageBuilder()
    builder.setTags(null)
    const message = builder.build()

    tt.notOk(message.details.tags)
    tt.end()
  })

  t.test('with undefined', function (tt) {
    const builder = new MessageBuilder()
    builder.setTags(undefined)
    const message = builder.build()

    tt.notOk(message.details.tags)
    tt.end()
  })

  t.test('with non-array type', function (tt) {
    const builder = new MessageBuilder()
    builder.setTags(5)
    const message = builder.build()

    tt.notOk(message.details.tags)
    tt.end()
    t.end()
  })
})
