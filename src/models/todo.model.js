const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const dbPath = path.join(__dirname, '../../data/todos.db')
const logger = require('../logger');

// src/models/todo.model.js
const db = require('../db/knex')
async function initDB() {
  try {
    const exists = await db.schema.hasTable('todos')
    if (!exists) {
      await db.schema.createTable('todos', (table) => {
        table.increments('id').primary()
        table.string('title')
        table.boolean('done').defaultTo(false)
        table.timestamps(true, true)
      })
      logger.info({ msg: '📦 Table "todos" created' })
    } else {
      logger.info({ msg: '✅ Table "todos" already exists' })
    }

    await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_done ON todos(done)')
    logger.info({ msg: '✅ Index idx_done ensured' })
  } catch (err) {
    logger.error({ msg: '❌ Error during DB init', error: err.message })
  }
}

function insertTodoWithRetry(title, completed = false, attempt = 0, callback) {
  db('todos')
    .insert({ title, done: completed ? 1 : 0 })
    .returning(['id', 'title', 'done'])
    .then(([todo]) => {
      if (!todo) {
        return db('todos')
          .orderBy('id', 'desc')
          .first()
          .then((last) => callback(null, last))
      }
      return callback(null, todo)
    })
    .catch((err) => {
      if (err.message.includes('SQLITE_BUSY') && attempt < 5) {
        logger.warn({ msg: `Attempt ${attempt} failed, retrying INSERT`, error: err.message })
        return setTimeout(
          () => insertTodoWithRetry(title, completed, attempt + 1, callback),
          50
        )
      }
      logger.error({ msg: '❌ Insert failed after retries', error: err.message })
      return callback(err)
    })
}

function getTodos(callback) {
  db('todos')
    .orderBy('id', 'desc')
    .then((rows) => callback(null, rows))
    .catch((err) => {
      logger.error({ msg: 'Error fetching todos', error: err.message })
      callback(err)
    })
}

function updateTodo(id, completed, callback) {
  db('todos')
    .where({ id })
    .update({ done: completed ? 1 : 0 })
    .then((count) => callback(null, count))
    .catch((err) => {
      logger.error({ msg: 'Error updating todo', error: err.message })
      callback(err)
    })
}

module.exports = {
  initDB,
  insertTodoWithRetry,
  getTodos,
  updateTodo,
}
