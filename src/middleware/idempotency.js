const redisClient = require('../redis')
const logger = require('../logger');

function idempotencyMiddleware() {
  return async (req, res, next) => {
    const key = req.headers['x-idempotency-key']
    if (!key) {
      logger.warn({ msg: 'Missing idempotency key', route: '/api/todos', clientIp: req.ip });
      return res.status(400).json({ error: 'Idempotency key is required' })
    }

    const cached = await redisClient.get(`idem:${key}`)
    if (cached) {
      return res.status(200).json(JSON.parse(cached))
    }

    req.idempotencyKey = key
    next()
  }
}

module.exports = idempotencyMiddleware
