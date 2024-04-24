const express = require('express')
const http = require('http')
const httpTerminator = require('http-terminator').createHttpTerminator

const Raygun = require('../lib/raygun')

async function makeClientWithMockServer (clientOptions = {}) {
  return await new Promise((resolve, reject) => {
    const server = express()

    const entries = []
    const bulkEntries = []
    let messageCallback = null
    let batchMessageCallback = null

    server.use(express.json())
    server.post('/entries', (req, res) => {
      const body = req.body
      entries.push(body)

      if (messageCallback) {
        messageCallback(body)
        messageCallback = null
      }

      res.send('')
    })

    server.post('/entries/bulk', (req, res) => {
      bulkEntries.push(req.body)

      if (batchMessageCallback) {
        batchMessageCallback(req.body)
        batchMessageCallback = null
      }

      res.send('')
    })

    const listener = server.listen(0, 'localhost', () => {
      const address = listener.address()
      const client = new Raygun.Client().init({
        apiKey: 'TEST_API_KEY',
        host: 'localhost',
        port: address.port,
        useSSL: false,
        ...clientOptions
      })

      resolve({
        client,
        server: { entries, bulkEntries },
        address,
        stop: () => {
          httpTerminator({
            server: listener
          }).terminate()
          client.stop()
        },
        nextRequest: async (options = { maxWait: 10000 }) =>
          await new Promise((resolve, reject) => {
            messageCallback = resolve
            setTimeout(
              () => {
                reject(
                  new Error(`nextRequest timed out after ${options.maxWait}ms`)
                )
              },
              options.maxWait
            )
          }),
        nextBatchRequest: async (options = { maxWait: 10000 }) =>
          await new Promise((resolve, reject) => {
            batchMessageCallback = resolve
            setTimeout(
              () => {
                reject(
                  new Error(
                    `nextBatchRequest timed out after ${options.maxWait}ms`
                  )
                )
              },
              options.maxWait
            )
          })
      })
    })
  })
}

async function request (url) {
  return await new Promise((resolve, reject) => {
    const req = http.request(url, (res) => {
      res.on('end', resolve)
      res.resume()
    })

    req.on('error', reject)
    req.write('')
    req.end()
    req.shouldKeepAlive = false
  })
}

async function listen (app) {
  return await new Promise((resolve, reject) => {
    const server = app.listen(0, 'localhost', () => {
      resolve(server)
    })
  })
}

async function sleep (n) {
  return await new Promise((resolve, reject) => {
    setTimeout(resolve, n)
  })
}

module.exports = {
  makeClientWithMockServer,
  request,
  listen,
  sleep
}
