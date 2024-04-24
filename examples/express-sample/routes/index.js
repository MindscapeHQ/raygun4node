const express = require('express')
const router = express.Router()

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Express'
  })
})

router.get('/error', function (req, res, next) {
  // Call an object that doesn't exist to send an error to Raygun
  fakeObject.FakeMethod()
  res.send(500)
})

module.exports = router
