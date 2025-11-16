/**
 * Supabase Mock/Test Environment Configuration
 * 
 * This file provides configuration for using a test/mock Supabase project
 * instead of production credentials during testing.
 * 
 * IMPORTANT: Never use production credentials in tests!
 */

/**
 * Get test Supabase URL
 * Falls back to regular URL if test URL not configured
 */
export const getTestSupabaseUrl = () => {
  // Prefer test-specific URL
  return (
    process.env.TEST_SUPABASE_URL ||
    process.env.REACT_APP_SUPABASE_URL ||
    process.env.SUPABASE_URL
  );
};

/**
 * Get test Supabase anon key
 * Falls back to regular anon key if test key not configured
 */
export const getTestSupabaseAnonKey = () => {
  // Prefer test-specific key
  return (
    process.env.TEST_SUPABASE_ANON_KEY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  );
};

/**
 * Get test Supabase service role key (ONLY for backend tests)
 * Should NEVER be used in frontend code or exposed in client-side tests
 */
export const getTestSupabaseServiceKey = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Service role key should never be used in frontend code!');
  }
  
  return process.env.TEST_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
};

/**
 * Verify we're using test credentials (not production)
 */
export const verifyTestEnvironment = () => {
  const url = getTestSupabaseUrl();
  const key = getTestSupabaseAnonKey();

  if (!url || !key) {
    console.warn('⚠️  Supabase test credentials not configured');
    return false;
  }

  // Check if URL looks like a test project
  const isLocalhost = url.includes('localhost');
  const isTestProject = url.includes('test') || url.includes('staging') || isLocalhost;
  const isProduction = url.includes('supabase.co') && !isTestProject;

  if (isProduction && process.env.NODE_ENV === 'test') {
    console.warn('⚠️  Using production-like Supabase URL in test environment');
    console.warn('⚠️  Consider using a dedicated test project');
  }

  return true;
};

/**
 * Create a test Supabase client
 * Uses test credentials and includes safety checks
 */
export const createTestSupabaseClient = () => {
  const { createClient } = require('@supabase/supabase-js');
  
  const url = getTestSupabaseUrl();
  const key = getTestSupabaseAnonKey();

  if (!url || !key) {
    throw new Error('Test Supabase credentials not configured');
  }

  verifyTestEnvironment();

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false, // Disable in tests
      persistSession: false,   // Don't persist in tests
    },
  });
};

/**
 * Mock Supabase client for unit tests
 * Returns a mock client that doesn't make real API calls
 */
export const createMockSupabaseClient = () => {
  return {
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockResolvedValue({ data: null, error: null }),
      delete: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      signIn: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
};

export default {
  getTestSupabaseUrl,
  getTestSupabaseAnonKey,
  getTestSupabaseServiceKey,
  verifyTestEnvironment,
  createTestSupabaseClient,
  createMockSupabaseClient,
};

