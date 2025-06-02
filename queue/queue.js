const { Queue } = require('bullmq')
const { connection } = require('./redis-conn')

const todoQueue = new Queue('todoQueue', { connection })

module.exports = todoQueue
