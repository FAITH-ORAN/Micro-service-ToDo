const redisClient = require('../redis')
const todoQueue = require('../../queue/queue')
const model = require('../models/todo.model')

//const { insertTodoWithRetry } = require('../models/todo.model');

async function createTodo(req, res) {
  const { title } = req.body
  const idempotencyKey = req.idempotencyKey

  const job = await todoQueue.add('createTodo', { title })

  const tempResponse = { jobId: job.id, status: 'queued' }
  await redisClient.set(
    `idem:${idempotencyKey}`,
    JSON.stringify(tempResponse),
    { EX: 60 * 60 * 24 }
  )

  res.status(202).json(tempResponse)
  const cached = await redisClient.get(`idem:${idempotencyKey}`)
  if (cached) {
    return res.status(200).json(JSON.parse(cached))
  }

  // Use the retry helper defined in your model
  model.insertTodoWithRetry(title, 0, async (err, todo) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create todo' })
    }
    // Cache the response in Redis for 24h
    await redisClient.set(`idem:${idempotencyKey}`, JSON.stringify(todo), {
      EX: 60 * 60 * 24,
    })
    res.status(201).json(todo)
  })
}

function getAllTodos(req, res) {
  model.getTodos((err, todos) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch todos' })
    }
    res.status(200).json(todos)
  })
}

function updateTodo(req, res) {
  const { id } = req.params
  const { completed } = req.body

  model.updateTodo(id, completed, (err, changes) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update todo' })
    }
    if (changes === 0) {
      return res.status(404).json({ error: 'Todo not found' })
    }
    res.status(200).json({ message: 'Todo updated successfully' })
  })
}

module.exports = {
  createTodo,
  getAllTodos,
  updateTodo,
}
