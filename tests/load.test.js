import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export let options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    // Measure p95 of all requests tagged “type=crud”
    'http_req_duration{type:crud}': ['p(95)<500'],
  },
};

export default function () {
  // 1) POST a new todo with a random idempotency key
  const postPayload = JSON.stringify({ title: 'Test K6 ' + Math.random() });
  const postParams = {
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': uuidv4(), // unique key per request
    },
    tags: { type: 'crud' },
  };
  let postRes = http.post('http://localhost:3000/api/todos', postPayload, postParams);
  check(postRes, { 'POST /api/todos status is 201': (r) => r.status === 201 });

  // 2) Then GET the list of todos
  const getParams = { tags: { type: 'crud' } };
  let getRes = http.get('http://localhost:3000/api/todos', getParams);
  check(getRes, { 'GET /api/todos status is 200': (r) => r.status === 200 });

  // Small pause between iterations
  sleep(0.1);
}