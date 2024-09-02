import http from 'k6/http';
import { check } from 'k6';

export let options = {
  duration: '2s',
  vus: 100
};

export default function () {
  const url = 'http://127.0.0.1:3000/sign-up';
  const res = http.get(url);
  check(res, {'status is 200': (r) => r.status === 200});
}