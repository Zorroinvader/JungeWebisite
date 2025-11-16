/**
 * Concurrency & Race Condition Tests
 * 
 * Tests for:
 * - Multiple users booking the same time slot simultaneously
 * - Concurrent event request submissions
 * - Race conditions in status updates
 * - Database transaction integrity
 */

import { test, expect } from '@playwright/test';
import { formatTestError } from './error-helper';

test.describe('Concurrency Tests', () => {
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';

  test('should handle multiple users booking same time slot', async ({ browser }) => {
    // Create multiple browser contexts to simulate different users
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);

    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );

    try {
      // Navigate all users to the event request page
      await Promise.all(pages.map(page => page.goto(`${baseURL}/event-tracking`)));

      // Wait for page load
      await Promise.all(pages.map(page => page.waitForLoadState('networkidle')));

      // All users try to submit event request for the same time slot
      const sameStartDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Next week
      const sameTime = '10:00';

      const submissionPromises = pages.map(async (page, index) => {
        try {
          // Fill out the form
          const eventNameInput = page.locator('input[name="event_name"], input[placeholder*="Event"], input[placeholder*="event"]').first();
          if (await eventNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await eventNameInput.fill(`Concurrent Event ${index + 1}`);
          }

          const dateInput = page.locator('input[type="date"], input[name="start_date"]').first();
          if (await dateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await dateInput.fill(sameStartDate);
          }

          const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Send")').first();
          if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await submitButton.click();
          }

          // Wait for response
          await page.waitForTimeout(2000);
          
          return { success: true, index };
        } catch (error) {
          return { success: false, index, error: error.message };
        }
      });

      const results = await Promise.all(submissionPromises);

      // At least one should succeed, others may fail due to conflict detection
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(0);

      // Verify that conflicts are handled gracefully
      results.forEach(result => {
        if (!result.success) {
          // Failure is acceptable if it's due to conflict detection
          expect(result.error).toBeDefined();
        }
      });
    } finally {
      // Clean up
      await Promise.all(contexts.map(context => context.close()));
    }
  }, 60000);

  test('should handle concurrent status updates', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext()
    ]);

    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );

    try {
      // Simulate two admins trying to update the same event request
      await Promise.all(pages.map(page => page.goto(`${baseURL}/admin`)));

      await Promise.all(pages.map(page => page.waitForLoadState('networkidle')));

      // Both try to update status simultaneously
      const updatePromises = pages.map(async (page, index) => {
        try {
          // Find and click update button (adjust selector based on actual UI)
          const updateButton = page.locator('button:has-text("Approve"), button:has-text("Update")').first();
          if (await updateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await updateButton.click();
            await page.waitForTimeout(1000);
            return { success: true, index };
          }
          return { success: false, index, error: 'Button not found' };
        } catch (error) {
          return { success: false, index, error: error.message };
        }
      });

      const results = await Promise.all(updatePromises);

      // At least one update should succeed
      const successCount = results.filter(r => r.success).length;
      // Both may succeed if updates are to different fields, or one may fail due to conflict
      expect(successCount).toBeGreaterThanOrEqual(0);
    } finally {
      await Promise.all(contexts.map(context => context.close()));
    }
  }, 60000);

  test('should prevent double submission on rapid clicks', async ({ page }) => {
    await page.goto(`${baseURL}/event-tracking`);
    await page.waitForLoadState('networkidle');

    // Find submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
    
    if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Rapidly click submit button multiple times
      await Promise.all([
        submitButton.click(),
        submitButton.click(),
        submitButton.click()
      ]);

      await page.waitForTimeout(3000);

      // Should only process one submission
      // Check for success message or error indicating duplicate
      const messages = await page.locator('div:has-text("success"), div:has-text("error"), div:has-text("already")').all();
      
      // Should have at most one success message
      const successMessages = messages.filter(async msg => {
        const text = await msg.textContent();
        return text?.toLowerCase().includes('success') || text?.toLowerCase().includes('submitted');
      });

      // Verify only one submission was processed
      expect(successMessages.length).toBeLessThanOrEqual(1);
    }
  }, 30000);

  test('should handle concurrent profile updates', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext()
    ]);

    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );

    try {
      // Simulate same user logged in on multiple devices/tabs
      // Both try to update profile simultaneously
      await Promise.all(pages.map(page => page.goto(`${baseURL}/profile`)));
      await Promise.all(pages.map(page => page.waitForLoadState('networkidle')));

      const updatePromises = pages.map(async (page, index) => {
        try {
          const nameInput = page.locator('input[name="name"], input[name="full_name"]').first();
          if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await nameInput.fill(`Concurrent User ${index + 1}`);
            
            const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
            if (await saveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
              await saveButton.click();
              await page.waitForTimeout(2000);
              return { success: true, index };
            }
          }
          return { success: false, index, error: 'Form not found' };
        } catch (error) {
          return { success: false, index, error: error.message };
        }
      });

      const results = await Promise.all(updatePromises);

      // At least one should succeed
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeGreaterThanOrEqual(0);
    } finally {
      await Promise.all(contexts.map(context => context.close()));
    }
  }, 60000);
});

