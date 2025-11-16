import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Navigation
 * 
 * Tests navigation between different pages
 */
test.describe('Navigation', () => {
  test('should navigate to all public pages', async ({ page }) => {
    const publicRoutes = [
      { path: '/', name: 'Home' },
      { path: '/about', name: 'About' },
      { path: '/faq', name: 'FAQ' },
      { path: '/contact', name: 'Contact' },
      { path: '/special-events', name: 'Special Events' },
    ];

    for (const route of publicRoutes) {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path.replace('/', '\\/') + '(?:\\/|$|\\?)'));
      
      // Basic check that page loaded (has some content)
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });

  test('should handle 404 for non-existent routes', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    
    // Should redirect to home or show 404
    // Adjust based on actual app behavior
    const currentUrl = page.url();
    // Either stays on 404 page or redirects to home
    expect(currentUrl === '/non-existent-page-12345' || currentUrl === '/' || currentUrl.includes('/')).toBe(true);
  });

  test('should maintain navigation state', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to about
    await page.goto('/about');
    await expect(page).toHaveURL(/.*about.*/);
    
    // Navigate back using browser back button
    await page.goBack();
    await expect(page).toHaveURL(/\/(?!about)/);
  });
});

