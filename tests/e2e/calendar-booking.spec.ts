import { test, expect } from '@playwright/test';
import { formatTestError } from './error-helper';

/**
 * E2E Tests for Calendar Booking Functionality
 * 
 * Tests calendar display, date selection, and event booking flow
 */
test.describe('Calendar Booking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display calendar on homepage', async ({ page }) => {
    // Check if calendar container is visible
    const calendarContainer = page.locator('.rbc-calendar, [class*="calendar"], [class*="Calendar"]').first();
    await expect(calendarContainer).toBeVisible({ timeout: 10000 });
    
    // Check if calendar has month view
    const monthView = page.locator('.rbc-month-view, .rbc-month-row').first();
    await expect(monthView).toBeVisible({ timeout: 5000 });
  });

  test('should display calendar navigation controls', async ({ page }) => {
    // Check for previous/next month buttons
    const prevButton = page.locator('button').filter({ hasText: /‹|prev|previous|zurück/i }).first();
    const nextButton = page.locator('button').filter({ hasText: /›|next|weiter/i }).first();
    
    // At least one navigation button should be visible
    const hasNavButtons = await prevButton.isVisible().catch(() => false) || 
                          await nextButton.isVisible().catch(() => false);
    
    expect(hasNavButtons).toBeTruthy();
  });

  test('should display current month and year', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForTimeout(2000);
    
    // Check for month/year label (could be in various formats)
    const monthYearText = page.locator('h2, [class*="label"], [class*="month"], [class*="year"]')
      .filter({ hasText: /(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|January|February|March|April|May|June|July|August|September|October|November|December)/i })
      .first();
    
    // Month/year should be visible
    await expect(monthYearText).toBeVisible({ timeout: 5000 });
  });

  test('should allow clicking on calendar dates', async ({ page }) => {
    // Wait for calendar to fully load
    await page.waitForTimeout(2000);
    
    // Find clickable date cells - exclude off-range dates (previous/next month)
    const dateCells = page.locator('.rbc-day-bg:not(.rbc-off-range-bg)');
    const cellCount = await dateCells.count();
    
    expect(cellCount).toBeGreaterThan(0);
    
    // Try clicking on a valid date cell (not off-range)
    if (cellCount > 0) {
      // Get a date cell that's in the current month (not off-range)
      // Use a cell that's not the first (to avoid edge cases) but also not too far
      const validDateCell = dateCells.nth(Math.min(10, Math.floor(cellCount / 2))); // Use middle-ish cell
      
      // Scroll calendar into view first
      await validDateCell.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // Click on the date cell with force to bypass any intercepting elements
      await validDateCell.click({ timeout: 10000, force: true });
      
      // Wait for modal or form to appear
      await page.waitForTimeout(1500);
      
      // After clicking, either:
      // 1. Modal should appear (GuestOrRegisterModal or PublicEventRequestForm)
      // 2. Or date should be selected
      const modal = page.locator('[role="dialog"], .modal, [class*="Modal"], [class*="modal"]').first();
      const modalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      
      // If modal appears, that's good - date click is working
      // If no modal, check if there's any form or input that appeared
      if (!modalVisible) {
        const form = page.locator('form, input[name="title"], input[name="event_name"], [class*="EventRequest"]').first();
        const formVisible = await form.isVisible({ timeout: 2000 }).catch(() => false);
        expect(formVisible || modalVisible).toBeTruthy();
      } else {
        expect(modalVisible).toBeTruthy();
      }
    }
  });

  test('should show event request form when clicking a date', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForTimeout(2000);
    
    // Find and click a valid date cell (not off-range)
    const dateCell = page.locator('.rbc-day-bg:not(.rbc-off-range-bg)').first();
    
    // Scroll into view and click
    await dateCell.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await dateCell.click({ timeout: 10000, force: true });
    
    // Wait for modal or form to appear
    await page.waitForTimeout(1500);
    
    // Check for event request form or guest/register modal
    const eventForm = page.locator('input[name="title"], input[name="event_name"], [class*="EventRequest"], [class*="event-request"]').first();
    const guestModal = page.getByText(/gast|guest|anmelden|register|registrieren|als gast fortfahren/i).first();
    const modal = page.locator('[role="dialog"], .modal, [class*="Modal"]').first();
    
    const formVisible = await eventForm.isVisible({ timeout: 2000 }).catch(() => false);
    const modalVisible = await guestModal.isVisible({ timeout: 2000 }).catch(() => false);
    const anyModalVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
    
    // Either the form or modal should appear
    expect(formVisible || modalVisible || anyModalVisible).toBeTruthy();
  });

  test('should display calendar events if available', async ({ page }) => {
    // Wait for calendar to load events
    await page.waitForTimeout(3000);
    
    // Check for event elements in calendar
    const events = page.locator('.rbc-event, [class*="event"], [class*="Event"]');
    const eventCount = await events.count();
    
    // Events may or may not be present, but calendar should still be functional
    // Just verify calendar is rendered
    const calendar = page.locator('.rbc-calendar, [class*="calendar"]').first();
    await expect(calendar).toBeVisible();
  });

  test('should navigate between months', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForTimeout(2000);
    
    // Get current month text - look for the calendar header
    const monthLabel = page.locator('h2, [class*="label"], .rbc-toolbar-label').filter({ 
      hasText: /(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|January|February|March|April|May|June|July|August|September|October|November|December)/i 
    }).first();
    
    await expect(monthLabel).toBeVisible({ timeout: 5000 });
    const initialMonth = await monthLabel.textContent().catch(() => '');
    expect(initialMonth).toBeTruthy();
    
    // Click next month button - look for button with › or NEXT
    const nextButton = page.locator('button').filter({ hasText: /›|next|weiter/i }).or(
      page.locator('button').filter({ hasText: /›/ })
    ).first();
    
    await expect(nextButton).toBeVisible({ timeout: 5000 });
    await nextButton.click();
    
    // Wait for calendar to update
    await page.waitForTimeout(1500);
    
    // Month should have changed
    const newMonth = await monthLabel.textContent().catch(() => '');
    expect(newMonth).toBeTruthy();
    expect(newMonth).not.toBe(initialMonth);
  });

  test('should handle date selection for logged-in users', async ({ page }) => {
    // This test assumes user might be logged in
    // If not logged in, it should show guest/register modal
    
    await page.waitForTimeout(2000);
    
    // Click on a valid date (not off-range)
    const dateCell = page.locator('.rbc-day-bg:not(.rbc-off-range-bg)').first();
    
    // Scroll and click
    await dateCell.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await dateCell.click({ timeout: 10000, force: true });
    
    await page.waitForTimeout(1500);
    
    // Should show either:
    // 1. Event request form (if logged in)
    // 2. Guest/Register modal (if not logged in)
    const hasForm = await page.locator('form, input[name="title"], input[name="event_name"]').first().isVisible({ timeout: 2000 }).catch(() => false);
    const hasModal = await page.locator('[role="dialog"], .modal, [class*="Modal"]').first().isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(hasForm || hasModal).toBeTruthy();
  });
});

