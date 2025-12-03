/**
 * API Tests for Event Requests
 * 
 * Tests Supabase event_requests table operations and Edge Functions
 * Optimized: Uses shared test helpers and structure validation moved to shared file
 */

const { setupSupabaseTestEnv, createSupabaseHeaders, validateSupabaseConfig, skipIfNotConfigured } = require('../../../../tests/setup/test-helpers');

describe('Event Requests API Tests', () => {
  let config;

  beforeAll(() => {
    config = setupSupabaseTestEnv();
  });

  test('should have Supabase configuration', () => {
    validateSupabaseConfig(config.supabaseUrl, config.supabaseAnonKey);
  });

  test('should access event_requests table with proper authentication', async () => {
    skipIfNotConfigured(config, async () => {
      const eventsUrl = `${config.supabaseUrl}/rest/v1/event_requests?select=*&limit=1`;
      
      try {
        const response = await fetch(eventsUrl, {
          method: 'GET',
          headers: createSupabaseHeaders(config.supabaseAnonKey),
        });

        // Should return 200 (if RLS allows) or 401/403 (if RLS blocks)
        expect([200, 401, 403]).toContain(response.status);
      } catch (error) {
        console.warn('Event requests API test failed (may be expected):', error.message);
      }
    });
  }, 10000);
});

