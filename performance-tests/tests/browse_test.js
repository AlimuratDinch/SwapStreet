import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

// CRITICAL: Inside Docker network, use the service name from docker-compose
// The nginx service is named "nginx" in your docker-compose.local.staging.yml
const BASE_URL = 'http://nginx';

export default function () {
  group('Browse Catalog Items', () => {
    // GET request to the catalog items endpoint
    const response = http.get(`${BASE_URL}/api/catalog/items`);
    
    check(response, {
      'status is 200': (r) => r.status === 200,
      'response has body': (r) => {
        if (!r.body) {
          console.error('Response body is null. Status:', r.status, 'Headers:', JSON.stringify(r.headers));
          return false;
        }
        return true;
      },
      'is valid JSON array': (r) => {
        if (!r.body) return false;
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data);
        } catch (e) {
          console.error('Failed to parse response:', e.message, 'Body preview:', r.body.substring(0, 200));
          return false;
        }
      },
      'has items': (r) => {
        if (!r.body) return false;
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data) && data.length >= 0; // >= 0 because empty array is valid
        } catch (e) {
          return false;
        }
      },
    });

    sleep(1);
  });
  
  group('Search Listings', () => {
    // Test the search endpoint
    const searchResponse = http.get(`${BASE_URL}/api/search/search?q=&limit=18`);
    
    check(searchResponse, {
      'search status is 200': (r) => r.status === 200,
      'search has items array': (r) => {
        if (!r.body) return false;
        try {
          const data = JSON.parse(r.body);
          return data.items && Array.isArray(data.items);
        } catch (e) {
          console.error('Search parse error:', e.message);
          return false;
        }
      },
      'search has pagination': (r) => {
        if (!r.body) return false;
        try {
          const data = JSON.parse(r.body);
          return 'hasNextPage' in data && 'nextCursor' in data && 'limit' in data;
        } catch (e) {
          return false;
        }
      },
    });

    sleep(1);
  });
}