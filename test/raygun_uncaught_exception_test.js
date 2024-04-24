const util = require('util')
const childProcess = require('child_process')

const test = require('tap').test

const { makeClientWithMockServer } = require('./utils')

test('reporting uncaught exceptions', async function (t) {
  const testEnvironment = await makeClientWithMockServer()
  const messagePromise = testEnvironment.nextRequest()

  await util
    .promisify(childProcess.exec)(
      'node -r ts-node/register ./raygun_uncaught_exception_app.js',
      {
        cwd: __dirname,
        stdio: 'inherit',
        env: {
          ...process.env,
          RAYGUN_API_KEY: 'test',
          RAYGUN_API_PORT: testEnvironment.address.port
        }
      }
    )
    .catch(() => {})

  const message = await messagePromise

  testEnvironment.stop()

  t.equal(message.details.error.message, 'test')
  t.end()
})
