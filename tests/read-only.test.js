import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    'http_req_duration': ['p(95)<500'],
  },
};

export default function () {
  let res = http.get('http://localhost:3000/api/todos');
  check(res, { 'GET /api/todos is 200': (r) => r.status === 200 });
  sleep(0.1);
}