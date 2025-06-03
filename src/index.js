const express = require('express')
const dotenv = require('dotenv')

const initTelemetry = require('./middleware/otel')
const rateLimiter = require('./middleware/rateLimiter')
const { initDB } = require('./models/todo.model')
const todosRouter = require('./routes/todos')
const { metricsMiddleware, register } = require('./middleware/metrics')

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000

initTelemetry()

initDB()

// app.use(
//   compression({
//     threshold: 0, // compress every JSON response, no matter how small
//   })
// );

app.use(express.json())
app.use(rateLimiter)
app.use(metricsMiddleware)

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' })
})

app.use('/api/todos', todosRouter)

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
