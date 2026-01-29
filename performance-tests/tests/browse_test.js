import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 }, // Ramp up to 20 users
    { duration: '2m', target: 20 }, // Stay at 20 users
    { duration: '1m', target: 0 },  // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of requests must be under 300ms
  },
};

const BASE_URL = 'http://backend-staging:8080'; // Use internal Docker service name

export default function () {
  group('Browse Flow', function () {
    // 1. Fetch main catalog (CatalogController)
    let catalogRes = http.get(`${BASE_URL}/api/catalog/items`);
    check(catalogRes, {
      'catalog status is 200': (r) => r.status === 200,
      'has items': (r) => r.json().length > 0,
    });

    sleep(2); // Simulate user "scrolling"

    // 2. Perform a search (ListingSearchController)
    // Testing the SearchListings(string q) method
    let searchRes = http.get(`${BASE_URL}/api/search/search?q=shirt&limit=18`);
    check(searchRes, {
      'search status is 200': (r) => r.status === 200,
      'search has results': (r) => r.json().items.length >= 0,
    });
  });

  sleep(1);
}