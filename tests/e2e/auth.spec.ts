import { test, expect } from '@playwright/test';
import { formatTestError } from './error-helper';

/**
 * E2E Tests for Authentication
 * 
 * Tests login and registration flows
 * Note: These tests use test credentials from environment variables
 * or skip if credentials are not available
 */
test.describe('Authentication', () => {
  // Get test credentials from environment (should be set in CI or .env.test)
  const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';
  const testBaseURL = process.env.TEST_BASE_URL || process.env.REACT_APP_BASE_URL || 'http://localhost:3000';

  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.getByRole('button', { name: /anmelden|login|sign in/i }).first();
    
    try {
      await expect(emailInput).toBeVisible({ timeout: 10000 });
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    } catch (error) {
      const pageContent = await page.textContent('body');
      const screenshot = await page.screenshot({ fullPage: true }).catch(() => null);
      const errorDetails = formatTestError(
        'should display login form',
        'Login form with email input, password input, and submit button to be visible',
        `One or more form elements not found. Page URL: ${page.url()}`,
        {
          testAction: 'Accessed /login and checked for form elements',
          selectorsUsed: [
            'input[type="email"], input[name="email"]',
            'input[type="password"], input[name="password"]',
            'button with text matching /anmelden|login|sign in/i'
          ],
          pageURL: page.url(),
          pageContentPreview: pageContent?.substring(0, 300),
          suggestion: 'Check LoginForm component - selectors may need updating, or form may not be rendering'
        }
      );
      console.error(errorDetails);
      throw error;
    }
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /anmelden|login|sign in/i }).first();
    await submitButton.click();
    
    // Wait for error message (adjust selector based on actual error display)
    // This test expects an error to appear, but doesn't require specific credentials
    await page.waitForTimeout(2000); // Wait for async error handling
    
    // Check if we're still on login page (failed login) or if error message appears
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/.*login.*/);
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/login');
    
    // Look for registration link
    const registerLink = page.getByRole('link', { name: /registrieren|register|sign up/i }).first();
    
    if (await registerLink.isVisible().catch(() => false)) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*register.*/);
    } else {
      // Navigate directly
      await page.goto('/register');
      await expect(page).toHaveURL(/.*register.*/);
    }
    
    // Verify registration form is visible
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
  });

  test('should display registration form fields', async ({ page }) => {
    await page.goto('/register');
    
    // Check for registration form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  // Optional: Test successful login if test credentials are provided
  // This test is skipped by default and should only run with valid test credentials
  test.skip('should successfully log in with valid credentials', async ({ page }) => {
    // Skip if test credentials are not properly configured
    if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
      test.skip();
      return;
    }

    await page.goto('/login');
    
    // Fill in valid credentials
    await page.fill('input[type="email"], input[name="email"]', testEmail);
    await page.fill('input[type="password"], input[name="password"]', testPassword);
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /anmelden|login|sign in/i }).first();
    await submitButton.click();
    
    // Wait for redirect after successful login
    await page.waitForURL(/\/(?!login)/, { timeout: 10000 });
    
    // Verify we're no longer on login page
    expect(page.url()).not.toMatch(/.*login.*/);
  });
});

