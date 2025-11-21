// FILE OVERVIEW
// - Purpose: Quick edit modal for updating event details (title, dates, times, notes) without full form; admin-only.
// - Used by: EventDetailsModal when admin clicks edit button; provides fast inline editing of event properties.
// - Notes: Production component. Uses eventsAPI.update for saving changes; validates date ranges and required fields.

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { eventsAPI } from '../../services/databaseApi';
import { useDarkMode } from '../../contexts/DarkModeContext';

const QuickEventEditModal = ({ isOpen, onClose, onSuccess, event }) => {
  const { isDarkMode } = useDarkMode();
  
  const [formData, setFormData] = useState({
    title: '',
    event_start_date: '',
    event_start_time: '',
    event_end_date: '',
    event_end_time: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load event data
  useEffect(() => {
    if (event && isOpen) {
      // Reset states
      setError('');
      setSuccess(false);
      setLoading(false);
      
      // Parse dates properly - handle multiple date field formats
      let startDate, endDate;
      
      // Try multiple date sources in order of preference
      const startDateStr = event.exact_start_datetime || event.start_date || (event.startDate ? event.startDate.toISOString() : null)
      const endDateStr = event.exact_end_datetime || event.end_date || (event.endDate ? event.endDate.toISOString() : null)
      
      if (startDateStr) {
        // Check if date includes time component
        if (startDateStr.includes('T')) {
          startDate = new Date(startDateStr);
        } else {
          // Date-only format - assume midnight local time
          startDate = new Date(startDateStr + 'T00:00:00');
        }
      } else {
        startDate = new Date();
      }
      
      if (endDateStr) {
        if (endDateStr.includes('T')) {
          endDate = new Date(endDateStr);
        } else {
          endDate = new Date(endDateStr + 'T00:00:00');
        }
      } else {
        endDate = new Date();
      }
      
      // Check if dates are valid
      const isValidStartDate = !isNaN(startDate.getTime());
      const isValidEndDate = !isNaN(endDate.getTime());
      
      // Use parsed dates if valid, otherwise use current date/time
      const safeStartDate = isValidStartDate ? startDate : new Date();
      const safeEndDate = isValidEndDate ? endDate : new Date();

      // Format dates in local timezone for display
      const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const formatLocalTime = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      setFormData({
        title: event.title || '',
        event_start_date: formatLocalDate(safeStartDate),
        event_start_time: formatLocalTime(safeStartDate),
        event_end_date: formatLocalDate(safeEndDate),
        event_end_time: formatLocalTime(safeEndDate)
      });
    }
  }, [event, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Bitte geben Sie einen Namen für die Veranstaltung ein');
      }

      // Combine date and time - ensure proper ISO format
      const startDatetime = `${formData.event_start_date}T${formData.event_start_time}:00`;
      const endDatetime = `${formData.event_end_date}T${formData.event_end_time}:00`;
      
      // Convert to ISO string to ensure proper timezone handling
      const startDateObj = new Date(startDatetime);
      const endDateObj = new Date(endDatetime);
      
      // Use ISO strings for database
      const startDatetimeISO = startDateObj.toISOString();
      const endDatetimeISO = endDateObj.toISOString();

      // Validate dates
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        throw new Error('Ungültige Datums- oder Zeitangaben');
      }

      if (startDateObj >= endDateObj) {
        throw new Error('Das Enddatum muss nach dem Startdatum liegen');
      }
      
      // Update title and date/time
      // Update start_date and end_date (events table may not have exact_start_datetime/exact_end_datetime)
      const updateData = {
        title: formData.title.trim(),
        start_date: startDatetimeISO,
        end_date: endDatetimeISO
      }
      
      // Only add exact fields if they exist in the event (for event_requests compatibility)
      if (event.exact_start_datetime !== undefined || event.exact_end_datetime !== undefined) {
        updateData.exact_start_datetime = startDatetimeISO
        updateData.exact_end_datetime = endDatetimeISO
      }
      
      await eventsAPI.update(event.id, updateData);
      // Show success message
      setSuccess(true);
      
      // Call onSuccess immediately to refresh calendar
      if (onSuccess) {
        onSuccess();
      }
      
      // Also dispatch refresh event for calendar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshCalendar'))
      }
      
      // Wait a moment to show success message, then close
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);

    } catch (err) {
      setError(err.message || 'Fehler beim Aktualisieren der Veranstaltung');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // MOBILE RESPONSIVE: Modal with proper mobile sizing and touch-friendly interactions
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4"
      style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
    >
      <div 
        className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-xl sm:rounded-2xl shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain'
        }}
      >
        {/* Header */}
        {/* MOBILE RESPONSIVE: Header with responsive padding */}
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''}`}>
          <div className="flex-1 min-w-0 pr-2">
            <h2 className={`text-lg sm:text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} truncate`}>
              {event?.title}
            </h2>
            <p className={`text-xs sm:text-sm mt-1 text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
              Veranstaltung bearbeiten
            </p>
          </div>
          <button
            onClick={onClose}
            className={`min-w-[44px] min-h-[44px] p-2 hover:opacity-70 active:scale-95 transition-all rounded-lg text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} touch-manipulation flex items-center justify-center flex-shrink-0`}
            aria-label="Schließen"
            style={{ touchAction: 'manipulation' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* MOBILE RESPONSIVE: Form with responsive padding */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className={`rounded-lg p-3 bg-red-50 ${isDarkMode ? 'dark:bg-red-900/20' : ''} border border-red-200 ${isDarkMode ? 'dark:border-red-800' : ''}`}>
              <p className={`text-sm text-red-600 ${isDarkMode ? 'dark:text-red-400' : ''}`}>{error}</p>
            </div>
          )}

          {success && (
            <div className={`rounded-lg p-3 bg-green-50 ${isDarkMode ? 'dark:bg-green-900/20' : ''} border border-green-200 ${isDarkMode ? 'dark:border-green-800' : ''}`}>
              <p className={`text-sm text-green-600 ${isDarkMode ? 'dark:text-green-400' : ''}`}>
                ✅ Event erfolgreich aktualisiert! Die Änderungen werden gespeichert...
              </p>
            </div>
          )}

          {/* Event Title */}
          <div>
            <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
              Veranstaltungs-Name *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
              style={{ fontSize: '16px' }}
              placeholder="Veranstaltungs-Name eingeben"
            />
          </div>

          {/* Start */}
          <div>
            <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
              Von *
            </label>
            {/* MOBILE RESPONSIVE: Stack on mobile, side-by-side on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="date"
                name="event_start_date"
                value={formData.event_start_date}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
              style={{ fontSize: '16px' }}
              />
              <input
                type="time"
                name="event_start_time"
                value={formData.event_start_time}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
              style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* End */}
          <div>
            <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
              Bis *
            </label>
            {/* MOBILE RESPONSIVE: Stack on mobile, side-by-side on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="date"
                name="event_end_date"
                value={formData.event_end_date}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
              style={{ fontSize: '16px' }}
              />
              <input
                type="time"
                name="event_end_time"
                value={formData.event_end_time}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
              style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* MOBILE RESPONSIVE: Buttons stack on mobile, side-by-side on desktop */}
          <div className={`flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''}`}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`w-full sm:w-auto px-4 py-2 min-h-[44px] text-base font-medium rounded-lg border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''} active:scale-95 transition-all touch-manipulation`}
              style={{ touchAction: 'manipulation' }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className={`w-full sm:w-auto px-4 py-2 min-h-[44px] text-base font-medium text-white rounded-lg ${success ? 'bg-green-600' : 'bg-[#A58C81]'} ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center transition-all touch-manipulation`}
              style={{ touchAction: 'manipulation' }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Speichern...
                </>
              ) : success ? (
                <>
                  <div className="h-4 w-4 mr-2">✅</div>
                  Gespeichert!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Speichern
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickEventEditModal;

