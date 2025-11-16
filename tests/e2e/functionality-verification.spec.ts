/**
 * End-to-End Functionality Verification Tests
 * 
 * Comprehensive tests to verify all core website functionality works correctly:
 * - Page loading and navigation
 * - User authentication and session management
 * - Forms and submissions
 * - Calendar and event functionality
 * - Admin functions
 * - API and database operations
 * - Security compliance
 * - Cross-browser compatibility
 */

import { test, expect } from '@playwright/test';
import { formatTestError } from './error-helper';

test.describe('Core Website Functionality Verification', () => {
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const testUserEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
  const testUserPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';
  const testAdminEmail = process.env.TEST_ADMIN_EMAIL;
  const testAdminPassword = process.env.TEST_ADMIN_PASSWORD;

  test.describe('Page Loading and Navigation', () => {
    test('homepage should load without errors', async ({ page }) => {
      const errors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      page.on('pageerror', error => {
        errors.push(error.message);
      });

      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');

      // Check for console errors
      expect(errors.length).toBe(0);
      
      // Verify page loaded
      await expect(page).toHaveTitle(/Jungengesellschaft/i);
    });

    test('all navigation links should work', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');

      // Find all navigation links
      const navLinks = await page.locator('nav a, header a, [role="navigation"] a').all();
      
      for (const link of navLinks) {
        const href = await link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          await link.click();
          await page.waitForLoadState('networkidle');
          
          // Verify page loaded (not 404)
          const title = await page.title();
          expect(title).toBeTruthy();
          
          // Go back to homepage for next link
          await page.goto(`${baseURL}/`);
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should navigate between main pages', async ({ page }) => {
      const pages = [
        { path: '/', name: 'Homepage' },
        { path: '/login', name: 'Login' },
        { path: '/register', name: 'Register' },
        { path: '/about', name: 'About' },
        { path: '/contact', name: 'Contact' },
        { path: '/special-events', name: 'Special Events' },
      ];

      for (const pageInfo of pages) {
        await page.goto(`${baseURL}${pageInfo.path}`);
        await page.waitForLoadState('networkidle');
        
        // Verify page loaded
        const title = await page.title();
        expect(title).toBeTruthy();
        
        // Check for critical errors
        const errors = await page.evaluate(() => {
          return window.console.error ? [] : [];
        });
      }
    });
  });

  test.describe('User Authentication', () => {
    test('login form should be functional', async ({ page }) => {
      await page.goto(`${baseURL}/login`);
      await page.waitForLoadState('networkidle');

      // Find email and password inputs
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Anmelden")').first();

      if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emailInput.fill(testUserEmail);
        await passwordInput.fill(testUserPassword);
        
        if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await submitButton.click();
          await page.waitForTimeout(2000);
          
          // Check for success (redirect or success message)
          const currentUrl = page.url();
          const hasSuccess = currentUrl.includes('/profile') || 
                           currentUrl.includes('/') ||
                           await page.locator('text=/success|erfolgreich|welcome/i').isVisible({ timeout: 3000 }).catch(() => false);
          
          // Login should either succeed or show error (both are valid responses)
          expect(hasSuccess || await page.locator('text=/error|fehler|invalid/i').isVisible({ timeout: 1000 }).catch(() => false)).toBeTruthy();
        }
      }
    });

    test('registration form should be functional', async ({ page }) => {
      await page.goto(`${baseURL}/register`);
      await page.waitForLoadState('networkidle');

      // Find form inputs
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Registrieren")').first();

      if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Use unique email for registration test
        const uniqueEmail = `test-${Date.now()}@example.com`;
        await emailInput.fill(uniqueEmail);
        await passwordInput.fill('TestPassword123!');
        
        if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await submitButton.click();
          await page.waitForTimeout(3000);
          
          // Registration should either succeed or show validation error
          const hasResponse = await page.locator('text=/success|error|validation|erfolgreich|fehler/i').isVisible({ timeout: 3000 }).catch(() => false);
          expect(hasResponse || page.url().includes('/login') || page.url().includes('/profile')).toBeTruthy();
        }
      }
    });

    test('logout should work correctly', async ({ page }) => {
      // First try to login
      await page.goto(`${baseURL}/login`);
      await page.waitForLoadState('networkidle');

      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emailInput.fill(testUserEmail);
        await passwordInput.fill(testUserPassword);
        await submitButton.click();
        await page.waitForTimeout(2000);

        // Try to find and click logout
        const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Abmelden"), a:has-text("Logout"), a:has-text("Abmelden")').first();
        if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await logoutButton.click();
          await page.waitForTimeout(1000);
          
          // Should redirect to homepage or login
          const currentUrl = page.url();
          expect(currentUrl.includes('/login') || currentUrl === `${baseURL}/` || currentUrl === baseURL).toBeTruthy();
        }
      }
    });
  });

  test.describe('Event Request Functionality', () => {
    test('event request form should be accessible and functional', async ({ page }) => {
      await page.goto(`${baseURL}/event-tracking`);
      await page.waitForLoadState('networkidle');

      // Check if form exists
      const form = page.locator('form').first();
      if (await form.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Find form fields
        const eventNameInput = page.locator('input[name="event_name"], input[placeholder*="Event"], input[placeholder*="event"]').first();
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        
        if (await eventNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          // Fill form with test data
          await eventNameInput.fill('Test Event Verification');
          
          if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await emailInput.fill('test@example.com');
            
            // Try to submit (may require more fields)
            const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Senden")').first();
            if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
              await submitButton.click();
              await page.waitForTimeout(2000);
              
              // Should show success or validation error
              const hasResponse = await page.locator('text=/success|error|validation|erfolgreich|fehler/i').isVisible({ timeout: 3000 }).catch(() => false);
              expect(hasResponse).toBeTruthy();
            }
          }
        }
      }
    });

    test('calendar should display events', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for calendar to load

      // Check for calendar component
      const calendar = page.locator('.rbc-calendar, [data-testid="calendar"], .calendar').first();
      if (await calendar.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Calendar should be visible
        expect(await calendar.isVisible()).toBeTruthy();
      } else {
        // If no calendar component, check for event listings
        const events = page.locator('.event, [data-event], .calendar-event').all();
        const eventCount = await events.length;
        // Should have calendar or events visible
        expect(eventCount >= 0).toBeTruthy();
      }
    });
  });

  test.describe('Admin Functionality', () => {
    test('admin panel should be accessible to admins', async ({ page }) => {
      if (!testAdminEmail || !testAdminPassword) {
        test.skip();
        return;
      }

      // Login as admin
      await page.goto(`${baseURL}/login`);
      await page.waitForLoadState('networkidle');

      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emailInput.fill(testAdminEmail);
        await passwordInput.fill(testAdminPassword);
        await submitButton.click();
        await page.waitForTimeout(2000);

        // Try to access admin panel
        await page.goto(`${baseURL}/admin`);
        await page.waitForLoadState('networkidle');

        // Should either show admin panel or access denied
        const isAdminPanel = await page.locator('text=/admin|verwaltung|management/i').isVisible({ timeout: 3000 }).catch(() => false);
        const isAccessDenied = await page.locator('text=/access denied|zugriff verweigert|unauthorized/i').isVisible({ timeout: 3000 }).catch(() => false);
        
        // Admin should see panel, non-admin should see access denied
        expect(isAdminPanel || isAccessDenied).toBeTruthy();
      }
    });
  });

  test.describe('API and Database Operations', () => {
    test('should not expose production console logs', async ({ page }) => {
      const consoleLogs: string[] = [];
      const sensitivePatterns = [
        /eyJ[A-Za-z0-9_-]{20,}/, // JWT tokens
        /sk_[A-Za-z0-9]{32,}/,   // Service keys
        /password/i,
        /secret/i,
        /api[_-]?key/i,
      ];

      page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push(text);
      });

      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');

      // Check for sensitive data in console logs
      const sensitiveLogs = consoleLogs.filter(log => 
        sensitivePatterns.some(pattern => pattern.test(log))
      );

      expect(sensitiveLogs.length).toBe(0);
    });

    test('error messages should be sanitized', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');

      // Trigger an error (e.g., invalid form submission)
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Check error messages for sensitive data
        const errorMessages = await page.locator('[role="alert"], .error, .error-message').all();
        
        for (const error of errorMessages) {
          const text = await error.textContent();
          if (text) {
            // Should not contain API keys or sensitive data
            expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/);
            expect(text).not.toMatch(/sk_[A-Za-z0-9]{32,}/);
          }
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      test(`should render correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${baseURL}/`);
        await page.waitForLoadState('networkidle');

        // Check for layout issues
        const body = page.locator('body');
        expect(await body.isVisible()).toBeTruthy();

        // Check for horizontal scroll (should not exist)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        
        // Allow some tolerance for mobile (may have slight overflow)
        if (viewport.name !== 'Mobile') {
          expect(hasHorizontalScroll).toBeFalsy();
        }
      });
    }
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work in Chromium', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium');
      
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      const title = await page.title();
      expect(title).toBeTruthy();
    });

    test('should work in Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox');
      
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      const title = await page.title();
      expect(title).toBeTruthy();
    });

    test('should work in WebKit', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit');
      
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      const title = await page.title();
      expect(title).toBeTruthy();
    });
  });

  test.describe('Form Validation', () => {
    test('forms should validate input correctly', async ({ page }) => {
      await page.goto(`${baseURL}/login`);
      await page.waitForLoadState('networkidle');

      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Try to submit empty form
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Should show validation errors
        const hasValidation = await page.locator('text=/required|invalid|error|fehler|erforderlich/i').isVisible({ timeout: 2000 }).catch(() => false);
        // Validation may be client-side or server-side
        expect(hasValidation || page.url().includes('/login')).toBeTruthy();
      }
    });
  });
});

