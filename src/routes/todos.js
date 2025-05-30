const express = require('express')
const controller = require('../controllers/todo.controller')
const router = express.Router()

router.post('/', controller.createTodo)
router.get('/', controller.getAllTodos)
router.patch('/:id', controller.updateTodo)

module.exports = router
