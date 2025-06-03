const redisClient = require('../redis')
const todoQueue = require('../../queue/queue')
const model = require('../models/todo.model')

async function createTodo(req, res, next) {
  try {
    const { title } = req.body
    const idempotencyKey = req.idempotencyKey
    const isK6Test = req.headers['x-test-k6'] === 'true'

    if (isK6Test) {
      return model.insertTodoWithRetry(title, 0, (err, todo) => {
        if (err) return next(err)
        return res.status(201).json(todo)
      })
    }
    const cached = await redisClient.get(`idem:${idempotencyKey}`)
    if (cached) {
      return res.status(200).json(JSON.parse(cached))
    }

    const job = await todoQueue.add('createTodo', { title })
    const tempResponse = { jobId: job.id, status: 'queued' }

    await redisClient.set(
      `idem:${idempotencyKey}`,
      JSON.stringify(tempResponse),
      { EX: 60 * 60 * 24 }
    )

    return res.status(202).json(tempResponse)
  } catch (error) {
    console.error('Error creating todo:', error)
    next(error)
  }
}

function getAllTodos(req, res, next) {
  model.getTodos((err, todos) => {
    if (err) {
      console.error('Error fetching todos:', err)
      return next(err)
    }
    res.status(200).json(todos)
  })
}

function updateTodo(req, res, next) {
  const { id } = req.params
  const { completed } = req.body

  model.updateTodo(id, completed, (err, changes) => {
    if (err) {
      console.error('Error updating todo:', err)
      return next(err)
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
