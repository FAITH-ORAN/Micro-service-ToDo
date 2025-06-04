const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),                   // add ISO timestamp
    format.json()                         // output as JSON
  ),
  defaultMeta: { service: 'todo-api' },  // optional: include service name
  transports: [
    new transports.Console()              // log everything to stdout
  ],
});

module.exports = logger;