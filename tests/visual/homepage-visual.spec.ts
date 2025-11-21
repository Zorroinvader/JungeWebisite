import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Homepage
 * 
 * These tests capture screenshots and compare them against baseline snapshots.
 * 
 * To update snapshots: npm run test:visual:update
 */
test.describe('Homepage Visual Regression', () => {
  test('homepage should match baseline snapshot', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Take screenshot and compare with baseline
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled', // Disable animations for consistent screenshots
    });
  });

  test('homepage mobile view should match baseline', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('login page should match baseline snapshot', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

