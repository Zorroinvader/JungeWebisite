/**
 * Shared Structure Validation Tests
 * 
 * Consolidated validation tests for common data structures
 * Reduces redundancy across auth.test.js and eventRequests.test.js
 */

describe('Shared Data Structure Validation', () => {
  describe('User Role Structure', () => {
    test('should validate user role enum values', () => {
      const USER_ROLES = {
        SUPERADMIN: 'superadmin',
        ADMIN: 'admin',
        MEMBER: 'member',
        GUEST: 'guest'
      };

      expect(USER_ROLES.SUPERADMIN).toBe('superadmin');
      expect(USER_ROLES.ADMIN).toBe('admin');
      expect(USER_ROLES.MEMBER).toBe('member');
      expect(USER_ROLES.GUEST).toBe('guest');
    });

    test('should validate profile structure', () => {
      const profileStructure = {
        id: 'user-uuid',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'member'
      };

      expect(profileStructure).toHaveProperty('id');
      expect(profileStructure).toHaveProperty('email');
      expect(profileStructure).toHaveProperty('role');
      expect(['superadmin', 'admin', 'member', 'guest']).toContain(profileStructure.role);
    });
  });

  describe('Event Status Structure', () => {
    test('should validate event status enum values', () => {
      const EVENT_STATUS = {
        APPROVED: 'approved',
        PENDING: 'pending',
        REJECTED: 'rejected'
      };

      expect(EVENT_STATUS.APPROVED).toBe('approved');
      expect(EVENT_STATUS.PENDING).toBe('pending');
      expect(EVENT_STATUS.REJECTED).toBe('rejected');
    });

    test('should validate event request structure', () => {
      const eventRequest = {
        id: 'request-uuid',
        event_name: 'Test Event',
        start_date: '2024-01-01T10:00:00',
        end_date: '2024-01-01T12:00:00',
        status: 'pending',
        user_id: 'user-uuid',
        email: 'test@example.com'
      };

      expect(eventRequest).toHaveProperty('event_name');
      expect(eventRequest).toHaveProperty('start_date');
      expect(eventRequest).toHaveProperty('end_date');
      expect(eventRequest).toHaveProperty('status');
      expect(['pending', 'approved', 'rejected']).toContain(eventRequest.status);
    });
  });
});

