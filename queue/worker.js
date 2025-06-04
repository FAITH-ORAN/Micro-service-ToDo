const { Worker } = require('bullmq')
const { connection } = require('./redis-conn')
const model = require('../src/models/todo.model')
const { trace, context } = require('@opentelemetry/api')

const tracer = trace.getTracer('todo-worker')
const logger = require('../src/logger');

const worker = new Worker(
  'todoQueue',
  async (job) => {
    const { title, completed = false } = job.data

    const span = tracer.startSpan('process_todo_job', {
      attributes: {
        jobId: job.id,
        jobName: job.name,
        todoTitle: title,
        completed,
      },
    })

    return context.with(trace.setSpan(context.active(), span), () => {
      logger.info({
        msg: 'Worker processing job',
        jobId: job.id,
        title,
      });

      return new Promise((resolve, reject) => {
        model.insertTodoWithRetry(title, completed, 0, (err, todo) => {
          if (err) {
            console.error('❌ Worker failed to insert todo:', err.message)
            span.setStatus({ code: 2, message: 'Insert failed' })
            span.end()
            logger.error({
              msg: 'Failed to insert todo in worker',
              jobId: job.id,
              error: err.message,
            });
            return reject(err)
          }

          logger.info({
            msg: 'Todo inserted from worker (retry)',
            jobId: job.id,
            todoId: todo.id,
          });

          span.setStatus({ code: 1 })
          span.end()
          resolve(todo)
        })
      })
    })
  },
  { connection }
)

worker.on('completed', (job) => {
  logger.info({
    msg: 'Worker job completed',
    jobId: job.id,
  });
})

worker.on('failed', (job, err) => {
  logger.error({
    msg: 'Worker job failed',
    jobId: job.id,
    error: err.message || err.stack,
  });
})
