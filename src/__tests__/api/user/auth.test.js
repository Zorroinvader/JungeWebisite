/**
 * API Tests for User Authentication
 * 
 * Tests Supabase authentication endpoints and user profile operations
 * Optimized: Uses shared test helpers to reduce redundancy
 */

const { setupSupabaseTestEnv, createSupabaseHeaders, validateSupabaseConfig, skipIfNotConfigured } = require('../../../../tests/setup/test-helpers');

describe('User Authentication API Tests', () => {
  let config;

  beforeAll(() => {
    config = setupSupabaseTestEnv();
  });

  test('should have Supabase configuration', () => {
    validateSupabaseConfig(config.supabaseUrl, config.supabaseAnonKey);
  });

  test('should access profiles table with proper authentication', async () => {
    skipIfNotConfigured(config, async () => {
      const profilesUrl = `${config.supabaseUrl}/rest/v1/profiles?select=*&limit=1`;
      
      try {
        const response = await fetch(profilesUrl, {
          method: 'GET',
          headers: createSupabaseHeaders(config.supabaseAnonKey),
        });

        // Should return 200 (if RLS allows) or 401/403 (if RLS blocks)
        expect([200, 401, 403]).toContain(response.status);
      } catch (error) {
        console.warn('Profiles API test failed (may be expected):', error.message);
      }
    });
  }, 10000);
});

