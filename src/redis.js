const { createClient } = require('redis')
const logger = require('./logger');

const client = createClient({ url: 'redis://redis:6379' })

client.on('error', (err) => {
  logger.error({
    msg: 'Redis Client Error',
    error: err.message
  });
});

client.connect()
module.exports = client
