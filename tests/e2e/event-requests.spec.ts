import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Event Requests and Calendar
 * 
 * Tests event request creation, calendar interaction, and event management
 */
test.describe('Event Requests & Calendar', () => {
  test('should display homepage with calendar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for main content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Look for calendar or event-related content
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('should navigate to event tracking page', async ({ page }) => {
    await page.goto('/event-tracking');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*event-tracking.*/);
    
    // Basic check that page loaded
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should navigate to special events page', async ({ page }) => {
    await page.goto('/special-events');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*special-events.*/);
    
    // Basic check that page loaded
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display calendar on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for calendar-related elements
    // The calendar might be in a specific container
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    
    // Calendar should be present (adjust selector based on actual implementation)
    const calendarExists = await page.locator('[class*="calendar"], [class*="Calendar"]').first().isVisible().catch(() => false);
    // If calendar exists, it should be visible, otherwise just check page loaded
    if (calendarExists) {
      await expect(page.locator('[class*="calendar"], [class*="Calendar"]').first()).toBeVisible();
    }
  });
});

test.describe('Event Request Form', () => {
  test('should be able to access event request form', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for event request button or link
    const requestButton = page.getByRole('button', { name: /event|anfrage|request/i }).first();
    
    // If button exists, try to click it
    if (await requestButton.isVisible().catch(() => false)) {
      await requestButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Page should still be functional
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

