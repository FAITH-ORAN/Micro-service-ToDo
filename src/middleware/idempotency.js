const redisClient = require('../redis')

function idempotencyMiddleware() {
  return async (req, res, next) => {
    const key = req.headers['x-idempotency-key']
    if (!key) {
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
