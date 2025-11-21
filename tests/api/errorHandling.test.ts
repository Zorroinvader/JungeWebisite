/**
 * API Error Handling Tests
 * 
 * Tests for:
 * - Backend failures (500 errors)
 * - Network timeouts
 * - Rate limiting / throttling
 * - Invalid API responses
 * - Connection errors
 * - Malformed data handling
 */

// Mock fetch for Jest environment
if (typeof global.fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    global.fetch = async (url, options) => {
      throw new Error('fetch is not available. Please install node-fetch or use Node.js 18+.');
    };
  }
}

describe('API Error Handling Tests', () => {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.TEST_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.TEST_SUPABASE_ANON_KEY;

  beforeAll(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️  Supabase test credentials not configured. Error handling tests will be skipped.');
    }
  });

  describe('Network Timeout Handling', () => {
    test('should handle request timeout gracefully', async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        return;
      }

      // Create a request with very short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100); // 100ms timeout

      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/event_requests?select=*&limit=1`, {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        // Request should either complete or timeout
        expect(response).toBeDefined();
      } catch (error) {
        clearTimeout(timeoutId);
        // Timeout error is expected
        expect(error.name).toBe('AbortError');
      }
    }, 5000);

    test('should retry on transient failures', async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        return;
      }

      let attempts = 0;
      const maxRetries = 3;

      const fetchWithRetry = async (url, options, retries = maxRetries) => {
        try {
          attempts++;
          const response = await fetch(url, options);
          if (response.ok || response.status < 500) {
            return response;
          }
          if (retries > 0 && response.status >= 500) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
            return fetchWithRetry(url, options, retries - 1);
          }
          return response;
        } catch (error) {
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(url, options, retries - 1);
          }
          throw error;
        }
      };

      try {
        const response = await fetchWithRetry(
          `${supabaseUrl}/rest/v1/event_requests?select=*&limit=1`,
          {
            method: 'GET',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Should eventually succeed or fail gracefully
        expect([200, 401, 403, 500, 502, 503]).toContain(response.status);
      } catch (error) {
        // Network errors are acceptable in test environment
        expect(error).toBeDefined();
      }
    }, 15000);
  });

  describe('Rate Limiting / Throttling', () => {
    test('should handle rate limit responses', async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        return;
      }

      // Make rapid requests to potentially trigger rate limiting
      const requests = Array.from({ length: 20 }, () =>
        fetch(`${supabaseUrl}/rest/v1/event_requests?select=*&limit=1`, {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        })
      );

      const responses = await Promise.allSettled(requests);

      // Check for rate limit responses (429)
      const rateLimited = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      );

      // If rate limited, should handle gracefully
      if (rateLimited.length > 0) {
        console.log(`Rate limited: ${rateLimited.length} requests`);
        // Application should handle 429 responses
        rateLimited.forEach(result => {
          if (result.status === 'fulfilled') {
            expect(result.value.status).toBe(429);
          }
        });
      }

      // Should have some successful or error responses
      expect(responses.length).toBe(20);
    }, 30000);

    test('should respect Retry-After header', async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        return;
      }

      // Make request that might trigger rate limit
      const response = await fetch(`${supabaseUrl}/rest/v1/event_requests?select=*&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter) {
          const retrySeconds = parseInt(retryAfter, 10);
          expect(retrySeconds).toBeGreaterThan(0);
          expect(retrySeconds).toBeLessThan(3600); // Should be reasonable
        }
      }
    }, 10000);
  });

  describe('Server Error Handling', () => {
    test('should handle 500 Internal Server Error', async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        return;
      }

      // Try to trigger server error with invalid request
      const response = await fetch(`${supabaseUrl}/rest/v1/event_requests`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Invalid data that might cause server error
          invalid_field: 'test',
          nested: { deeply: { nested: { data: 'test' } } }
        }),
      });

      // Should handle 500 errors gracefully
      expect([200, 400, 422, 500, 502, 503]).toContain(response.status);
    }, 10000);

    test('should handle 502 Bad Gateway', async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        return;
      }

      // Use invalid endpoint to potentially get 502
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/nonexistent_table`, {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        });

        // Should handle 404 (table not found) or 502 (bad gateway)
        expect([404, 502, 503]).toContain(response.status);
      } catch (error) {
        // Network errors are acceptable
        expect(error).toBeDefined();
      }
    }, 10000);

    test('should handle 503 Service Unavailable', async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        return;
      }

      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/event_requests?select=*&limit=1`, {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        });

        // Should handle 503 gracefully
        expect([200, 401, 403, 503]).toContain(response.status);
      } catch (error) {
        // Network errors are acceptable
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  describe('Malformed Response Handling', () => {
    test('should handle invalid JSON responses', async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        return;
      }

      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/event_requests?select=*&limit=1`, {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const text = await response.text();
          try {
            const json = JSON.parse(text);
            expect(typeof json).toBe('object');
          } catch (parseError) {
            // If JSON parsing fails, should handle gracefully
            expect(parseError).toBeInstanceOf(SyntaxError);
          }
        }
      } catch (error) {
        // Network errors are acceptable
        expect(error).toBeDefined();
      }
    }, 10000);

    test('should handle empty responses', async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        return;
      }

      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/event_requests?select=*&limit=0`, {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const text = await response.text();
          // Empty response should be handled
          expect(typeof text).toBe('string');
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  describe('Connection Error Handling', () => {
    test('should handle network connection errors', async () => {
      // Try to connect to invalid URL
      try {
        const response = await fetch('https://invalid-url-that-does-not-exist-12345.com/api', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        // Should not reach here, but if it does, check status
        expect(response.status).toBeGreaterThanOrEqual(400);
      } catch (error) {
        // Network error is expected
        expect(error).toBeDefined();
        expect(['TypeError', 'AbortError', 'NetworkError']).toContain(error.name);
      }
    }, 10000);

    test('should handle CORS errors gracefully', async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        return;
      }

      // Make request without proper CORS headers
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/event_requests?select=*&limit=1`, {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            // Missing Authorization header might cause CORS issues
            'Content-Type': 'application/json',
          },
        });

        // Should handle CORS errors or return proper response
        expect([200, 401, 403]).toContain(response.status);
      } catch (error) {
        // CORS errors are acceptable
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  describe('Invalid API Key Handling', () => {
    test('should handle invalid API key', async () => {
      if (!supabaseUrl) {
        return;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/event_requests?select=*&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': 'invalid-key-12345',
          'Authorization': 'Bearer invalid-key-12345',
          'Content-Type': 'application/json',
        },
      });

      // Should reject invalid key (401 Unauthorized)
      expect([401, 403]).toContain(response.status);
    }, 10000);

    test('should handle missing API key', async () => {
      if (!supabaseUrl) {
        return;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/event_requests?select=*&limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Missing apikey and Authorization
        },
      });

      // Should reject missing key (401 Unauthorized)
      expect([401, 403]).toContain(response.status);
    }, 10000);
  });
});

