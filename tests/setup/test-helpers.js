/**
 * Shared Test Helpers
 * 
 * Common utilities for test setup, mocking, and configuration
 * Reduces redundancy across test files
 */

// Mock fetch for Jest environment (shared across all API tests)
if (typeof global.fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    global.fetch = async (url, options) => {
      throw new Error('fetch is not available. Please install node-fetch or use Node.js 18+.');
    };
  }
}

/**
 * Get Supabase test configuration
 * Centralized configuration check to reduce redundancy
 */
export const getSupabaseTestConfig = () => {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.TEST_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.TEST_SUPABASE_ANON_KEY;
  
  return {
    supabaseUrl,
    supabaseAnonKey,
    isConfigured: !!(supabaseUrl && supabaseAnonKey),
  };
};

/**
 * Setup Supabase test environment
 * Use in beforeAll hooks to reduce repeated setup
 */
export const setupSupabaseTestEnv = () => {
  const config = getSupabaseTestConfig();
  
  if (!config.isConfigured) {
    console.warn('⚠️  Supabase credentials not configured. Some tests may be skipped.');
  }
  
  return config;
};

/**
 * Create Supabase API headers
 * Standardized header creation for API tests
 */
export const createSupabaseHeaders = (anonKey) => {
  return {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Validate Supabase configuration
 * Shared validation logic
 */
export const validateSupabaseConfig = (supabaseUrl, supabaseAnonKey) => {
  expect(supabaseUrl).toBeDefined();
  expect(supabaseAnonKey).toBeDefined();
  
  if (supabaseUrl) {
    expect(supabaseUrl).toMatch(/^https?:\/\//);
  }
};

/**
 * Skip test if Supabase not configured
 * Helper for conditional test execution
 */
export const skipIfNotConfigured = (config, testFn) => {
  if (!config.isConfigured) {
    return; // Skip test
  }
  return testFn();
};

module.exports = {
  getSupabaseTestConfig,
  setupSupabaseTestEnv,
  createSupabaseHeaders,
  validateSupabaseConfig,
  skipIfNotConfigured,
};

