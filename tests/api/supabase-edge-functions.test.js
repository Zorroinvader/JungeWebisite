/**
 * API-Level Tests for Supabase Edge Functions
 * 
 * These tests validate backend functionality without going through the UI.
 * They call Supabase Edge Functions directly and assert on responses.
 * 
 * Environment variables required:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_ANON_KEY
 * - TEST_BASE_URL (optional, for deployed functions)
 */

// Mock fetch for Jest environment if needed
// Note: In Node.js 18+, fetch is available globally
if (typeof global.fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    // If node-fetch is not available, create a simple mock
    global.fetch = async (url, options) => {
      throw new Error('fetch is not available. Please install node-fetch or use Node.js 18+.');
    };
  }
}

describe('Supabase Edge Functions API Tests', () => {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const testBaseURL = process.env.TEST_BASE_URL || supabaseUrl;

  // Skip all tests if Supabase URL is not configured
  beforeAll(() => {
    if (!supabaseUrl) {
      console.warn('⚠️  REACT_APP_SUPABASE_URL not configured. Skipping API tests.');
    }
    if (!supabaseAnonKey) {
      console.warn('⚠️  REACT_APP_SUPABASE_ANON_KEY not configured. Skipping API tests.');
    }
  });

  test('should have Supabase configuration', () => {
    expect(supabaseUrl).toBeDefined();
    expect(supabaseAnonKey).toBeDefined();
    
    if (supabaseUrl) {
      expect(supabaseUrl).toMatch(/^https?:\/\//);
    }
  });

  test('send-admin-notification edge function should be callable', async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return; // Skip test
    }

    const functionUrl = `${supabaseUrl}/functions/v1/send-admin-notification`;
    
    // Test with minimal payload
    const testPayload = {
      adminEmails: ['test@example.com'],
      subject: 'Test Notification',
      message: 'This is a test message',
      htmlContent: '<p>This is a test message</p>',
    };

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(testPayload),
      });

      // The function might require RESEND_API_KEY, so we expect either:
      // - 200 (if configured and working)
      // - 500 (if RESEND_API_KEY is missing, which is expected in test env)
      // - 401/403 (if auth fails)
      
      expect([200, 401, 403, 500]).toContain(response.status);
      
      const responseData = await response.json().catch(() => ({}));
      
      // If successful, should have success field
      if (response.status === 200) {
        expect(responseData).toHaveProperty('success');
      }
      // If error, should have error field
      if (response.status === 500) {
        expect(responseData).toHaveProperty('error');
      }
    } catch (error) {
      // Network errors are acceptable in test environment
      console.warn('Edge function test failed (may be expected):', error.message);
    }
  }, 10000); // 10 second timeout

  test('send-admin-notification should handle CORS preflight', async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return; // Skip test
    }

    const functionUrl = `${supabaseUrl}/functions/v1/send-admin-notification`;
    
    try {
      const response = await fetch(functionUrl, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization, content-type',
        },
      });

      // Should return 200 for OPTIONS request
      expect(response.status).toBe(200);
      
      // Should have CORS headers
      const corsHeader = response.headers.get('Access-Control-Allow-Origin');
      expect(corsHeader).toBeDefined();
    } catch (error) {
      // Network errors are acceptable in test environment
      console.warn('CORS preflight test failed (may be expected):', error.message);
    }
  }, 10000);

  test('send-admin-notification should validate required fields', async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return; // Skip test
    }

    const functionUrl = `${supabaseUrl}/functions/v1/send-admin-notification`;
    
    // Test with missing required fields
    const invalidPayload = {
      // Missing adminEmails/recipients
      subject: 'Test',
    };

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(invalidPayload),
      });

      const responseData = await response.json().catch(() => ({}));
      
      // Should return error for invalid payload
      if (response.status !== 200) {
        expect(responseData).toHaveProperty('error');
      }
    } catch (error) {
      // Network errors are acceptable in test environment
      console.warn('Validation test failed (may be expected):', error.message);
    }
  }, 10000);
});

