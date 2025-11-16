/**
 * Expanded Visual Regression Tests
 * 
 * Tests for:
 * - Forms (event request, login, registration, profile)
 * - Calendar views (month, week, day)
 * - Modals and dialogs
 * - User profile pages
 * - Admin panels
 * - Special events pages
 * - Error states
 * - Loading states
 */

import { test, expect } from '@playwright/test';

test.describe('Expanded Visual Regression Tests', () => {
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';

  test.describe('Forms', () => {
    test('event request form should match baseline', async ({ page }) => {
      await page.goto(`${baseURL}/event-tracking`);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('event-request-form.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('login form should match baseline', async ({ page }) => {
      await page.goto(`${baseURL}/login`);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('login-form.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('registration form should match baseline', async ({ page }) => {
      await page.goto(`${baseURL}/register`);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('registration-form.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('profile form should match baseline', async ({ page }) => {
      await page.goto(`${baseURL}/profile`);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('profile-form.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Calendar Views', () => {
    test('calendar month view should match baseline', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      // Wait for calendar to render
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('calendar-month-view.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('calendar mobile view should match baseline', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('calendar-mobile-view.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Modals and Dialogs', () => {
    test('event details modal should match baseline', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      // Try to find and click an event to open modal
      const eventElement = page.locator('.rbc-event, [data-event], .calendar-event').first();
      if (await eventElement.isVisible({ timeout: 5000 }).catch(() => false)) {
        await eventElement.click();
        await page.waitForTimeout(1000);
        
        const modal = page.locator('[role="dialog"], .modal, [aria-modal="true"]').first();
        if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(modal).toHaveScreenshot('event-details-modal.png', {
            animations: 'disabled',
          });
        }
      }
    });

    test('confirmation dialog should match baseline', async ({ page }) => {
      await page.goto(`${baseURL}/admin`);
      await page.waitForLoadState('networkidle');
      
      // Try to trigger a confirmation dialog
      const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="delete"]').first();
      if (await deleteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await deleteButton.click();
        await page.waitForTimeout(500);
        
        const dialog = page.locator('[role="dialog"], .modal, [aria-modal="true"]').first();
        if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(dialog).toHaveScreenshot('confirmation-dialog.png', {
            animations: 'disabled',
          });
        }
      }
    });
  });

  test.describe('User Profile Pages', () => {
    test('profile page should match baseline', async ({ page }) => {
      await page.goto(`${baseURL}/profile`);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('profile-page.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('profile page mobile view should match baseline', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseURL}/profile`);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('profile-page-mobile.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Admin Panels', () => {
    test('admin panel should match baseline', async ({ page }) => {
      await page.goto(`${baseURL}/admin`);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('admin-panel.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('event requests list should match baseline', async ({ page }) => {
      await page.goto(`${baseURL}/admin`);
      await page.waitForLoadState('networkidle');
      
      // Wait for requests to load
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('event-requests-list.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Special Events Pages', () => {
    test('special events page should match baseline', async ({ page }) => {
      await page.goto(`${baseURL}/special-events`);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('special-events-page.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('special event detail page should match baseline', async ({ page }) => {
      await page.goto(`${baseURL}/special-events`);
      await page.waitForLoadState('networkidle');
      
      // Try to click on an event
      const eventLink = page.locator('a[href*="/special-events/"], .event-card, .event-item').first();
      if (await eventLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await eventLink.click();
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot('special-event-detail.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Error States', () => {
    test('404 error page should match baseline', async ({ page }) => {
      await page.goto(`${baseURL}/non-existent-page`);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('404-error-page.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('form validation errors should match baseline', async ({ page }) => {
      await page.goto(`${baseURL}/login`);
      await page.waitForLoadState('networkidle');
      
      // Submit form without filling it to trigger validation errors
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        await expect(page).toHaveScreenshot('form-validation-errors.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Loading States', () => {
    test('loading spinner should match baseline', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      
      // Capture loading state (before networkidle)
      await page.waitForTimeout(500);
      
      // Look for loading indicators
      const loadingIndicator = page.locator('.loading, .spinner, [aria-busy="true"]').first();
      if (await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(loadingIndicator).toHaveScreenshot('loading-spinner.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('tablet view should match baseline', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('homepage-tablet.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('desktop large view should match baseline', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('homepage-desktop-large.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });
});

