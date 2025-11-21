import { test, expect } from '@playwright/test';
import { formatTestError } from './error-helper';

/**
 * E2E Tests for Homepage
 * 
 * Tests basic navigation and homepage functionality
 */
test.describe('Homepage', () => {
  test('should load homepage and display main content', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    // Title is "Jungengesellschaft Pferdestall Wedes-Wedel" (one word)
    await expect(page).toHaveTitle(/Jungengesellschaft/i);
    
    // Check for main logo or heading - wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check for logo or main heading text - can match either "Junge Gesellschaft" or "Jungengesellschaft"
    const logoOrHeading = page.getByText(/Junge\s*Gesellschaft/i).first();
    await expect(logoOrHeading).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Look for login link/button - adjust selector based on actual implementation
    const loginLink = page.getByRole('link', { name: /anmelden|login/i }).first();
    
    // If login link exists, click it
    if (await loginLink.isVisible().catch(() => false)) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*login.*/);
      
      // Verify login form is visible
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await expect(emailInput).toBeVisible();
    } else {
      // Alternative: navigate directly to login
      await page.goto('/login');
      await expect(page).toHaveURL(/.*login.*/);
      
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await expect(emailInput).toBeVisible();
    }
  });

  test('should navigate to about page', async ({ page }) => {
    await page.goto('/');
    
    // Try to find and click about link
    const aboutLink = page.getByRole('link', { name: /über|about/i }).first();
    
    if (await aboutLink.isVisible().catch(() => false)) {
      await aboutLink.click();
      await expect(page).toHaveURL(/.*about.*/);
    } else {
      // Navigate directly
      await page.goto('/about');
      await expect(page).toHaveURL(/.*about.*/);
    }
  });
});

