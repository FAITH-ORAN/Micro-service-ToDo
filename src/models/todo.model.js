const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../../data/todos.db');

const db = new sqlite3.Database(dbPath);

function initDB() {

  // Enable Write-Ahead Logging (WAL)
  db.run('PRAGMA journal_mode = WAL');

  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER DEFAULT 0
    )
  `);

  // Create a composite index on (done, id)
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_todos_done_id 
      ON todos(done, id)
  `);
}

// This helper retries on SQLITE_BUSY up to 3 times.
function insertTodoWithRetry(title, attempt = 0, callback) {
  db.run('INSERT INTO todos (title) VALUES (?)', [title], function (err) {
    if (err && err.message.includes('SQLITE_BUSY') && attempt < 3) {
      // Wait 50ms and retry
      return setTimeout(() => {
        insertTodoWithRetry(title, attempt + 1, callback);
      }, 50);
    }
    // Either succeeds or out of retries
    return callback(err, { id: this.lastID, title, done: 0 });
  });
}

// getTodos now filters on done=0 and orders by id DESC
function getTodos(callback) {
  db.all('SELECT * FROM todos WHERE done = 0 ORDER BY id DESC', [], callback);
}


function updateTodo(id, completed, callback) {
  const query = `UPDATE todos SET done = ? WHERE id = ?`;
  db.run(query, [completed ? 1 : 0, id], function (err) {
    callback(err, this.changes);
  });
}

module.exports = {
  initDB,
  insertTodoWithRetry,
  getTodos,
  updateTodo,
};