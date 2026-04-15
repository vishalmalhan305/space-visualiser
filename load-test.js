import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users
    { duration: '1m', target: 50 },  // Stay at 50 users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% of requests must be below 100ms
  },
};

export default function () {
  // Test the paginated asteroid endpoint with filters
  let res = http.get('http://localhost:8080/api/asteroids/page?size=10&sortBy=velocity&sortDir=DESC');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has data': (r) => JSON.parse(r.body).content !== undefined,
  });
  sleep(1);
}
