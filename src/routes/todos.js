const express = require('express')
const controller = require('../controllers/todo.controller')
const validateSchema = require('../middleware/validateSchema')
const idempotency = require('../middleware/idempotency')

const todoSchema = require('../../schemas/todo.schema')
const updateTodoSchema = require('../../schemas/update-todo.schema')

const router = express.Router()

router.post(
  '/',
  idempotency(),
  validateSchema(todoSchema),
  controller.createTodo
)
router.get('/', controller.getAllTodos)
router.patch('/:id', validateSchema(updateTodoSchema), controller.updateTodo)

module.exports = router
