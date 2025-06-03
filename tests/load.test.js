import http from 'k6/http'
import { check, sleep } from 'k6'
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js'

export let options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    'http_req_duration{type:crud}': ['p(95)<500'],
    'http_req_duration{type:get}': ['p(95)<500'],
  },
}

export default function () {
  const title = 'Test K6 ' + Math.random()

  // POST /api/todos
  const postPayload = JSON.stringify({ title })
  const postParams = {
    headers: {
      'Content-Type': 'application/json',
      'X-Test-K6': 'true',
      'X-Idempotency-Key': uuidv4(),
    },
    tags: { type: 'crud' },
  }

  const postRes = http.post(
    'http://localhost:3000/api/todos',
    postPayload,
    postParams
  )

  check(postRes, {
    'POST /api/todos returns 201': (r) => r.status === 201,
  })

  // GET /api/todos
  const getRes = http.get('http://localhost:3000/api/todos', {
    tags: { type: 'get' },
  })

  check(getRes, {
    'GET /api/todos returns 200': (r) => r.status === 200,
  })

  sleep(1)
}
