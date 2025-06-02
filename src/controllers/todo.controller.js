const Ajv = require('ajv')
const { v4: uuidv4 } = require('uuid')
const redisClient = require('../redis')

const model = require('../models/todo.model')
const todoSchema = require('../../schemas/todo.schema')
const updateTodoSchema = require('../../schemas/update-todo.schema')

const ajv = new Ajv()
const validateCreate = ajv.compile(todoSchema)
const validateUpdate = ajv.compile(updateTodoSchema)
const { insertTodoWithRetry } = require('../models/todo.model');

async function createTodo(req, res) {
  const idempotencyKey = req.headers['x-idempotency-key']
  const { title } = req.body

  const isValid = validateCreate(req.body)
  if (!isValid) {
    return res
      .status(400)
      .json({ error: 'Invalid data', details: validateCreate.errors })
  }

  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency key is required' })
  }

  const cached = await redisClient.get(`idem:${idempotencyKey}`)
  if (cached) {
    return res.status(200).json(JSON.parse(cached))
  }

  // Use the retry helper defined in your model
  insertTodoWithRetry(title, 0, async (err, todo) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create todo' });
    }
    // Cache the response in Redis for 24h
    await redisClient.set(
      `idem:${idempotencyKey}`,
      JSON.stringify(todo),
      { EX: 60 * 60 * 24 }
    );
    res.status(201).json(todo);
  });
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
  const isValid = validateUpdate(req.body)
  if (!isValid) {
    return res
      .status(400)
      .json({ error: 'Invalid data', details: validateUpdate.errors })
  }
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
