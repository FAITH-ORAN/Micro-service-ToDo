const { Worker } = require('bullmq')
const { connection } = require('./redis-conn')
const model = require('../src/models/todo.model')
const { trace, context } = require('@opentelemetry/api')

const tracer = trace.getTracer('todo-worker')

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
      console.log(`👷 Worker is processing: ${title} (completed: ${completed})`)

      return new Promise((resolve, reject) => {
        model.insertTodoWithRetry(title, completed, 0, (err, todo) => {
          if (err) {
            console.error('❌ Worker failed to insert todo:', err.message)
            span.setStatus({ code: 2, message: 'Insert failed' })
            span.end()
            return reject(err)
          }

          console.log('✅ Todo inserted from worker (retry):', todo)
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
  console.log(`🎉 Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err?.message)
})
