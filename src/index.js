const express = require('express')
const dotenv = require('dotenv')

const initTelemetry = require('./middleware/otel')
const rateLimiter = require('./middleware/rateLimiter')
const { initDB } = require('./models/todo.model')
const todosRouter = require('./routes/todos')
const { metricsMiddleware, register } = require('./middleware/metrics')
const compressionMiddleware = require('./middleware/compression');
const logger = require('./logger');
const requestLogger = require('./middleware/requestLogger');

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000

initTelemetry()

initDB()
app.use(requestLogger);
app.use(compressionMiddleware);
app.use(express.json())
app.use(rateLimiter)
app.use(metricsMiddleware)

// Routes
app.get('/', (req, res) => {
  logger.info({ msg: 'Root route called' });
  res.json({ message: 'Hello, World!' });
})

app.use('/api/todos', todosRouter)

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

app.use((err, req, res, next) => {
  // Log the full error
  logger.error({
    msg: 'Unhandled error',
    error: err.stack || err.message,
    method: req.method,
    route: req.originalUrl
  });

  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  logger.info({ msg: `Server is running on http://localhost:${PORT}` });
})
