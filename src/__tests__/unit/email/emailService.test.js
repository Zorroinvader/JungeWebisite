/**
 * Unit Tests for Email Service
 * 
 * Tests email formatting, validation, and notification generation
 */

// Mock fetch globally
global.fetch = jest.fn();

// Mock secureConfig
jest.mock('../../../utils/secureConfig', () => ({
  getSupabaseUrl: () => 'https://test.supabase.co',
  getSupabaseAnonKey: () => 'test-anon-key',
  sanitizeError: (error) => error.message
}));

// Mock window.location for email links
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000'
  },
  writable: true
});

const {
  sendEmail,
  sendUserNotification,
  sendAdminNotificationEmail,
  sendTestEmail
} = require('../../../services/emailService');

describe('Email Service', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('sendEmail', () => {
    test('should send email successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await sendEmail(
        ['test@example.com'],
        'Test Subject',
        'Test message',
        '<p>Test HTML</p>'
      );

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/send-admin-notification'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer')
          }),
          body: expect.stringContaining('test@example.com')
        })
      );
    });

    test('should return false for empty recipients', async () => {
      const result = await sendEmail([], 'Subject', 'Message');
      expect(result).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should return false on API error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Error message'
      });

      const result = await sendEmail(['test@example.com'], 'Subject', 'Message');
      expect(result).toBe(false);
    });

    test('should return false on network error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendEmail(['test@example.com'], 'Subject', 'Message');
      expect(result).toBe(false);
    });

    test('should include HTML content when provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await sendEmail(
        ['test@example.com'],
        'Subject',
        'Plain text',
        '<p>HTML content</p>'
      );

      const callBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(callBody.htmlContent).toBe('<p>HTML content</p>');
    });

    test('should auto-generate HTML from plain text if not provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await sendEmail(
        ['test@example.com'],
        'Subject',
        'Line 1\nLine 2'
      );

      const callBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(callBody.htmlContent).toBe('Line 1<br>Line 2');
    });
  });

  describe('sendUserNotification', () => {
    test('should send initial_request notification', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const eventData = {
        requester_name: 'John Doe',
        title: 'Test Event',
        start_date: '2024-12-01',
        event_type: 'Public Event'
      };

      const result = await sendUserNotification(
        'user@example.com',
        eventData,
        'initial_request'
      );

      expect(result).toBe(true);
      const callBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(callBody.subject).toBe('Ihre Event-Anfrage wurde empfangen');
      expect(callBody.message).toContain('John Doe');
      expect(callBody.message).toContain('Test Event');
    });

    test('should send accepted notification', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const eventData = {
        requester_name: 'Jane Doe',
        title: 'Accepted Event',
        start_datetime: '2024-12-01T10:00:00',
        end_datetime: '2024-12-01T18:00:00'
      };

      const result = await sendUserNotification(
        'user@example.com',
        eventData,
        'accepted'
      );

      expect(result).toBe(true);
      const callBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(callBody.subject).toBe('Ihre Event-Anfrage wurde akzeptiert');
      expect(callBody.message).toContain('Jane Doe');
    });

    test('should send rejected notification', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const eventData = {
        requester_name: 'Bob Smith',
        title: 'Rejected Event',
        start_date: '2024-12-01'
      };

      const result = await sendUserNotification(
        'user@example.com',
        eventData,
        'rejected'
      );

      expect(result).toBe(true);
      const callBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(callBody.subject).toBe('Ihre Event-Anfrage - Update');
      expect(callBody.message).toContain('nicht angenommen');
    });

    test('should not send if email is missing', async () => {
      const result = await sendUserNotification('', {}, 'initial_request');
      expect(result).toBeUndefined();
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should handle default notification type', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await sendUserNotification('user@example.com', {}, 'unknown_type');

      const callBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(callBody.subject).toBe('Update zu Ihrer Event-Anfrage');
    });
  });

  describe('sendAdminNotificationEmail', () => {
    test('should send new_request notification to admins', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const eventData = {
        title: 'New Event Request',
        requester_name: 'John Doe',
        requester_email: 'john@example.com',
        start_date: '2024-12-01',
        event_type: 'Public Event'
      };

      const result = await sendAdminNotificationEmail(
        ['admin1@example.com', 'admin2@example.com'],
        eventData,
        'new_request'
      );

      expect(result).toBe(true);
      const callBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(callBody.subject).toBe('Neue Event-Anfrage');
      expect(callBody.message).toContain('New Event Request');
      expect(callBody.message).toContain('John Doe');
      expect(callBody.message).toContain('john@example.com');
      expect(callBody.adminEmails).toEqual(['admin1@example.com', 'admin2@example.com']);
    });

    test('should not send if admin emails array is empty', async () => {
      const result = await sendAdminNotificationEmail([], {}, 'new_request');
      expect(result).toBeUndefined();
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should handle default notification type', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const eventData = {
        title: 'Event Update',
        requester_name: 'John Doe'
      };

      await sendAdminNotificationEmail(
        ['admin@example.com'],
        eventData,
        'unknown_type'
      );

      const callBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(callBody.subject).toBe('Event-Anfrage Update');
    });
  });

  describe('sendTestEmail', () => {
    test('should send test email', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await sendTestEmail('test@example.com');

      expect(result).toBe(true);
      const callBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(callBody.subject).toBe('Test-E-Mail vom Event-Management-System');
      expect(callBody.message).toContain('Test-E-Mail');
      expect(callBody.adminEmails).toEqual(['test@example.com']);
    });
  });

  describe('Email Content Formatting', () => {
    test('should format dates correctly in German locale', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const eventData = {
        requester_name: 'Test User',
        title: 'Test Event',
        start_date: '2024-12-01',
        event_type: 'Public Event'
      };

      await sendUserNotification('user@example.com', eventData, 'initial_request');

      const callBody = JSON.parse(fetch.mock.calls[0][1].body);
      // Check that date is formatted (should contain the date in some form)
      expect(callBody.message).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
    });

    test('should include HTML version of message', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await sendUserNotification(
        'user@example.com',
        { requester_name: 'Test', title: 'Event' },
        'initial_request'
      );

      const callBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(callBody.htmlContent).toBeDefined();
      expect(callBody.htmlContent).toContain('<div');
      expect(callBody.htmlContent).toContain('</div>');
    });
  });
});

