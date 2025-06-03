const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const dbPath = path.join(__dirname, '../../data/todos.db')

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
      console.log('📦 Table "todos" created')
    } else {
      console.log('✅ Table "todos" already exists')
    }

    await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_done ON todos(done)')
    console.log('✅ Index idx_done ensured')
  } catch (err) {
    console.error('❌ Error during DB init:', err.message)
  }
}

function insertTodoWithRetry(title, attempt = 0, callback) {
  db('todos')
    .insert({ title })
    .returning(['id', 'title', 'done'])
    .then(([todo]) => {
      if (!todo) {
        // fallback pour SQLite
        return db('todos')
          .orderBy('id', 'desc')
          .first()
          .then((last) => callback(null, last))
      }
      return callback(null, todo)
    })
    .catch((err) => {
      if (err.message.includes('SQLITE_BUSY') && attempt < 5) {
        return setTimeout(
          () => insertTodoWithRetry(title, attempt + 1, callback),
          50
        )
      }
      return callback(err)
    })
}

function getTodos(callback) {
  db('todos')
    .where({ done: 0 })
    .orderBy('id', 'desc')
    .then((rows) => callback(null, rows))
    .catch((err) => callback(err))
}

function updateTodo(id, completed, callback) {
  db('todos')
    .where({ id })
    .update({ done: completed ? 1 : 0 })
    .then((count) => callback(null, count))
    .catch((err) => callback(err))
}

module.exports = {
  initDB,
  insertTodoWithRetry,
  getTodos,
  updateTodo,
}
