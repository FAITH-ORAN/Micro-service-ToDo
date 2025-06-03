module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './data/todos.db',
    },
    useNullAsDefault: true,
  },
  production: {
    client: 'pg',
    connection:
      process.env.POSTGRES_URL ||
      'postgres://postgres:password@localhost:5432/todos',
    pool: { min: 2, max: 10 },
  },
  staging: {
    client: 'sqlite3',
    connection: {
      filename: './data/todos.db',
    },
    useNullAsDefault: true,
  },
}
