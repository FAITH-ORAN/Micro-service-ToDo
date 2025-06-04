const logger = require('../logger');

module.exports = (req, res, next) => {
  const startHrTime = process.hrtime();

  // When the response finishes, log method, URL, status, and latency
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startHrTime);
    const ms = (seconds * 1e3 + nanoseconds / 1e6).toFixed(3);

    logger.info({
      msg: 'HTTP request',
      method: req.method,
      route: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: ms,
      timestamp: new Date().toISOString(),
    });
  });

  next();
};