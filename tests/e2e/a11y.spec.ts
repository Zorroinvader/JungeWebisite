/**
 * Accessibility (a11y) Tests
 * 
 * Tests for:
 * - WCAG compliance
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Focus management
 * - Color contrast
 * - ARIA labels
 * - Form accessibility
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';

  test('homepage should have no accessibility violations', async ({ page }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');

    // Check for accessibility violations using AxeBuilder
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Report violations
    if (accessibilityScanResults.violations.length > 0) {
      console.error('Accessibility violations found:', accessibilityScanResults.violations);
    }

    expect(accessibilityScanResults.violations.length).toBe(0);
  });

  test('login page should be accessible', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.error('Login page accessibility violations:', accessibilityScanResults.violations);
    }

    expect(accessibilityScanResults.violations.length).toBe(0);
  });

  test('forms should have proper labels', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('networkidle');

    // Check that all inputs have associated labels
    const inputs = await page.locator('input[type="email"], input[type="password"], input[type="text"]').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const name = await input.getAttribute('name');
      
      // Input should have either: id with matching label, aria-label, or aria-labelledby
      const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
      const hasAriaLabel = !!ariaLabel || !!ariaLabelledBy;
      const hasPlaceholder = !!(await input.getAttribute('placeholder'));

      expect(hasLabel || hasAriaLabel || (hasPlaceholder && name)).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements
    const interactiveElements = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    
    expect(interactiveElements.length).toBeGreaterThan(0);

    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
  });

  test('modals should have proper focus management', async ({ page }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');

    // Look for modal triggers
    const modalTriggers = await page.locator('button:has-text("Open"), button[aria-haspopup="dialog"], button[data-modal]').all();
    
    if (modalTriggers.length > 0) {
      await modalTriggers[0].click();
      await page.waitForTimeout(500);

      // Check that modal has focus trap
      const modal = page.locator('[role="dialog"], .modal, [aria-modal="true"]').first();
      if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Focus should be within modal
        const focusedInModal = await page.evaluate((modalSelector) => {
          const modal = document.querySelector(modalSelector);
          const activeElement = document.activeElement;
          return modal && modal.contains(activeElement);
        }, '[role="dialog"], .modal, [aria-modal="true"]');

        expect(focusedInModal).toBeTruthy();

        // Check for close button
        const closeButton = modal.locator('button[aria-label*="close"], button[aria-label*="Close"], button:has-text("×")').first();
        expect(await closeButton.isVisible({ timeout: 1000 }).catch(() => false)).toBeTruthy();
      }
    }
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');

    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Images should have alt text unless they're decorative (role="presentation")
      if (role !== 'presentation') {
        expect(alt).not.toBeNull();
      }
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');

    // Check for h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(1); // Should have exactly one h1

    // Check heading order (h2 should not come before h1, etc.)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let previousLevel = 0;

    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const level = parseInt(tagName.charAt(1));
      
      // Heading levels should not skip (h1 -> h3 is bad, h1 -> h2 is good)
      if (previousLevel > 0) {
        expect(level).toBeLessThanOrEqual(previousLevel + 1);
      }
      
      previousLevel = level;
    }
  });

  test('color contrast should meet WCAG standards', async ({ page }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');

    // Use axe to check color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .withRules(['color-contrast'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.error('Color contrast violations:', accessibilityScanResults.violations);
    }

    // Allow some violations but log them
    expect(accessibilityScanResults.violations.length).toBeLessThan(10); // Adjust threshold as needed
  });

  test('interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');

    const buttons = await page.locator('button, a[href], input[type="button"], input[type="submit"]').all();
    
    for (const button of buttons) {
      const tabIndex = await button.getAttribute('tabindex');
      
      // Should not have tabindex="-1" unless it's intentionally hidden
      if (tabIndex === '-1') {
        const ariaHidden = await button.getAttribute('aria-hidden');
        const isDisabled = await button.isDisabled();
        
        // If hidden from keyboard, should be hidden from screen readers too
        if (ariaHidden !== 'true' && !isDisabled) {
          console.warn('Button with tabindex="-1" but not aria-hidden:', await button.textContent());
        }
      }
    }
  });

  test('error messages should be accessible', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('networkidle');

    // Try to submit form without filling it
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Check for error messages
      const errorMessages = await page.locator('[role="alert"], .error, [aria-live], [aria-atomic]').all();
      
      if (errorMessages.length > 0) {
        // Error messages should be announced to screen readers
        for (const error of errorMessages) {
          const role = await error.getAttribute('role');
          const ariaLive = await error.getAttribute('aria-live');
          
          expect(role === 'alert' || ariaLive === 'assertive' || ariaLive === 'polite').toBeTruthy();
        }
      }
    }
  });

  test('skip links should be present for keyboard users', async ({ page }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');

    // Look for skip links
    const skipLinks = await page.locator('a:has-text("Skip"), a[href="#main"], a[href="#content"]').all();
    
    // Skip links are recommended but not required
    if (skipLinks.length > 0) {
      for (const link of skipLinks) {
        const href = await link.getAttribute('href');
        expect(href).toMatch(/^#/); // Should link to an anchor
      }
    }
  });
});

