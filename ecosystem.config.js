module.exports = {
  apps: [
    {
      name: 'todo-api',
      script: './src/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      merge_logs: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
