require('ts-node/register')
const raygun = require('../../lib/raygun')

// this exists entirely to test that using the batch transport doesn't keep the node process alive unnecessarily
const raygunClient = new raygun.Client().init({
  apiKey: 'example!',
  batch: true
})
