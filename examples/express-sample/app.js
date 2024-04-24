const config = require('config')

// Setup Raygun
const raygun = require('raygun')
const raygunClient = new raygun.Client().init({
  apiKey: config.Raygun.Key
})

const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const sassMiddleware = require('node-sass-middleware')

const routes = require('./routes/index')
const users = require('./routes/users')

const app = express()

// Set the user if we have one
raygunClient.user = function (req) {
  return 'user@example.com'
}

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// uncomment after placing your favicon in /public
// app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(cookieParser())
app.use(sassMiddleware({
  src: __dirname,
  dest: path.join(__dirname, 'public'),
  debug: true,
  outputStyle: 'compressed',
  prefix: '/stylesheets'
}))
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', routes)
app.use('/users', users)

// Add the Raygun Express handler
app.use(raygunClient.expressHandler)

module.exports = app
