module.exports = {
  apps: [
    {
      name: 'todo-api',
      script: './src/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
