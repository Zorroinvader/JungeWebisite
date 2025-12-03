/**
 * Unit Tests for Event Validation Utilities
 * 
 * Tests for eventValidation.js utility functions:
 * - checkTimeOverlap
 * - checkEventConflicts
 * - formatConflictMessage
 * - validateEventTimes
 * - canScheduleOnSameDay
 */

import {
  checkTimeOverlap,
  checkEventConflicts,
  formatConflictMessage,
  validateEventTimes,
  canScheduleOnSameDay
} from '../../../utils/eventValidation';

describe('Event Validation Utilities', () => {
  describe('checkTimeOverlap', () => {
    test('should detect overlapping times', () => {
      const start1 = new Date('2024-01-01T10:00:00');
      const end1 = new Date('2024-01-01T12:00:00');
      const start2 = new Date('2024-01-01T11:00:00');
      const end2 = new Date('2024-01-01T13:00:00');
      
      expect(checkTimeOverlap(start1, end1, start2, end2)).toBe(true);
    });

    test('should detect non-overlapping times', () => {
      const start1 = new Date('2024-01-01T10:00:00');
      const end1 = new Date('2024-01-01T12:00:00');
      const start2 = new Date('2024-01-01T13:00:00');
      const end2 = new Date('2024-01-01T15:00:00');
      
      expect(checkTimeOverlap(start1, end1, start2, end2)).toBe(false);
    });

    test('should handle adjacent times (no overlap)', () => {
      const start1 = new Date('2024-01-01T10:00:00');
      const end1 = new Date('2024-01-01T12:00:00');
      const start2 = new Date('2024-01-01T12:00:00');
      const end2 = new Date('2024-01-01T14:00:00');
      
      expect(checkTimeOverlap(start1, end1, start2, end2)).toBe(false);
    });

    test('should handle string dates', () => {
      expect(checkTimeOverlap(
        '2024-01-01T10:00:00',
        '2024-01-01T12:00:00',
        '2024-01-01T11:00:00',
        '2024-01-01T13:00:00'
      )).toBe(true);
    });
  });

  describe('checkEventConflicts', () => {
    const existingEvents = [
      {
        id: '1',
        title: 'Existing Event 1',
        start_date: '2024-01-01T10:00:00',
        end_date: '2024-01-01T12:00:00'
      },
      {
        id: '2',
        title: 'Existing Event 2',
        start_date: '2024-01-01T14:00:00',
        end_date: '2024-01-01T16:00:00'
      }
    ];

    test('should detect conflicts with existing events', () => {
      const newEvent = {
        title: 'New Event',
        start_date: '2024-01-01T11:00:00',
        end_date: '2024-01-01T13:00:00'
      };

      const result = checkEventConflicts(existingEvents, newEvent);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictingEvents).toHaveLength(1);
      expect(result.conflictingEvents[0].id).toBe('1');
    });

    test('should not detect conflicts when times do not overlap', () => {
      const newEvent = {
        title: 'New Event',
        start_date: '2024-01-01T17:00:00',
        end_date: '2024-01-01T18:00:00'
      };

      const result = checkEventConflicts(existingEvents, newEvent);
      expect(result.hasConflict).toBe(false);
      expect(result.conflictingEvents).toHaveLength(0);
    });

    test('should exclude event being updated from conflict check', () => {
      const newEvent = {
        id: '1',
        title: 'Updated Event',
        start_date: '2024-01-01T10:00:00',
        end_date: '2024-01-01T12:00:00'
      };

      const result = checkEventConflicts(existingEvents, newEvent, '1');
      expect(result.hasConflict).toBe(false);
    });

    test('should handle events with start/end instead of start_date/end_date', () => {
      const existingEventsAlt = [
        {
          id: '1',
          title: 'Event',
          start: '2024-01-01T10:00:00',
          end: '2024-01-01T12:00:00'
        }
      ];

      const newEvent = {
        title: 'New Event',
        start: '2024-01-01T11:00:00',
        end: '2024-01-01T13:00:00'
      };

      const result = checkEventConflicts(existingEventsAlt, newEvent);
      expect(result.hasConflict).toBe(true);
    });
  });

  describe('formatConflictMessage', () => {
    test('should return empty string for no conflicts', () => {
      expect(formatConflictMessage([])).toBe('');
    });

    test('should format single conflict message', () => {
      const conflicts = [
        {
          title: 'Test Event',
          start_date: '2024-01-01T10:00:00',
          end_date: '2024-01-01T12:00:00'
        }
      ];

      const message = formatConflictMessage(conflicts);
      expect(message).toContain('Test Event');
      expect(message).toContain('überschneidet sich');
    });

    test('should format multiple conflicts', () => {
      const conflicts = [
        {
          title: 'Event 1',
          start_date: '2024-01-01T10:00:00',
          end_date: '2024-01-01T12:00:00'
        },
        {
          event_name: 'Event 2',
          start_date: '2024-01-01T14:00:00',
          end_date: '2024-01-01T16:00:00'
        }
      ];

      const message = formatConflictMessage(conflicts);
      expect(message).toContain('Event 1');
      expect(message).toContain('Event 2');
    });
  });

  describe('validateEventTimes', () => {
    test('should validate correct time range', () => {
      const result = validateEventTimes(
        '2024-01-01T10:00:00',
        '2024-01-01T12:00:00'
      );
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should reject invalid start date', () => {
      const result = validateEventTimes('invalid', '2024-01-01T12:00:00');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Startdatum');
    });

    test('should reject invalid end date', () => {
      const result = validateEventTimes('2024-01-01T10:00:00', 'invalid');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Enddatum');
    });

    test('should reject end before start', () => {
      const result = validateEventTimes(
        '2024-01-01T12:00:00',
        '2024-01-01T10:00:00'
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('nach dem Startdatum');
    });

    test('should reject equal start and end times', () => {
      const result = validateEventTimes(
        '2024-01-01T10:00:00',
        '2024-01-01T10:00:00'
      );
      expect(result.isValid).toBe(false);
    });
  });

  describe('canScheduleOnSameDay', () => {
    test('should allow scheduling when no events exist', () => {
      expect(canScheduleOnSameDay([], {
        start_date: '2024-01-01T10:00:00',
        end_date: '2024-01-01T12:00:00'
      })).toBe(true);
    });

    test('should allow scheduling when no conflicts', () => {
      const eventsOnDay = [
        {
          start_date: '2024-01-01T10:00:00',
          end_date: '2024-01-01T12:00:00'
        }
      ];

      const newEvent = {
        start_date: '2024-01-01T13:00:00',
        end_date: '2024-01-01T15:00:00'
      };

      expect(canScheduleOnSameDay(eventsOnDay, newEvent)).toBe(true);
    });

    test('should prevent scheduling when conflicts exist', () => {
      const eventsOnDay = [
        {
          start_date: '2024-01-01T10:00:00',
          end_date: '2024-01-01T12:00:00'
        }
      ];

      const newEvent = {
        start_date: '2024-01-01T11:00:00',
        end_date: '2024-01-01T13:00:00'
      };

      expect(canScheduleOnSameDay(eventsOnDay, newEvent)).toBe(false);
    });
  });
});

