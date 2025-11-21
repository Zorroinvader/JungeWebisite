import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Visual Regression Test Configuration
 * 
 * This configuration runs visual regression tests that compare screenshots
 * against stored baseline snapshots.
 * 
 * To update snapshots: npm run test:visual:update
 * 
 * Note: Playwright runs all tests even if some fail (graceful failure handling).
 * Errors are collected and reported at the end by the test runner scripts.
 */
export default defineConfig({
  testDir: './tests/visual',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only - helps with flaky tests */
  retries: process.env.CI ? 2 : 0,
  
  /* Don't stop on first failure - run all tests */
  maxFailures: undefined,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'], // Show each test as it runs in real-time
    ...(process.env.CI ? [['html']] : []) // Add HTML report in CI
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.TEST_BASE_URL || process.env.REACT_APP_BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot mode for visual tests */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for visual testing - use consistent browser */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use consistent viewport for visual tests
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Expect options for visual comparisons */
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 5000,
    
    /* Threshold for pixel comparison */
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixels: 100,
    },
  },
});

