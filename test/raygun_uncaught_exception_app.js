const Raygun = require('../')
const API_KEY = process.env.RAYGUN_API_KEY
const API_PORT = process.env.RAYGUN_API_PORT

new Raygun.Client().init({
  apiKey: API_KEY,
  host: 'localhost',
  port: API_PORT,
  useSSL: false,
  reportUncaughtExceptions: true
})

throw new Error('test')
