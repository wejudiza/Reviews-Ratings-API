import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  vus: 500,
  duration: '30s',
};

export default function () {
  http.get('http://localhost:3003/reviews?product_id=16065');
  sleep(1);
}
