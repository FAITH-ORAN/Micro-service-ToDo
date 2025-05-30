const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const dbPath = path.join(__dirname, '../../data/todos.db')

const db = new sqlite3.Database(dbPath)

function initDB() {
  db.run(`CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        done INTEGER DEFAULT 0)`)
}

function insertTodo(title, callback) {
  db.run('INSERT INTO todos (title) VALUES (?)', [title], function (err) {
    if (err) return callback(err)
    callback(null, { id: this.lastID, title, done: 0 })
  })
}

function getTodos(callback) {
  db.all('SELECT * FROM todos ORDER BY id DESC', [], callback)
}

function updateTodo(id, completed, callback) {
  const query = `UPDATE todos SET done = ? WHERE id = ?`
  db.run(query, [completed ? 1 : 0, id], function (err) {
    callback(err, this.changes)
  })
}

module.exports = {
  initDB,
  insertTodo,
  getTodos,
  updateTodo,
}
