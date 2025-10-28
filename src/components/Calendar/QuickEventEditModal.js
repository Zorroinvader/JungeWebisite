import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { eventsAPI } from '../../services/httpApi';
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
      
      // Parse dates properly - handle both date-only and datetime formats
      let startDate, endDate;
      
      if (event.start_date) {
        // Check if date includes time component
        if (event.start_date.includes('T')) {
          startDate = new Date(event.start_date);
        } else {
          // Date-only format - assume midnight UTC
          startDate = new Date(event.start_date + 'T00:00:00Z');
        }
      } else {
        startDate = new Date();
      }
      
      if (event.end_date) {
        if (event.end_date.includes('T')) {
          endDate = new Date(event.end_date);
        } else {
          endDate = new Date(event.end_date + 'T00:00:00Z');
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
        throw new Error('Bitte geben Sie einen Event-Namen ein');
      }

      // Combine date and time
      const startDatetime = `${formData.event_start_date}T${formData.event_start_time}:00`;
      const endDatetime = `${formData.event_end_date}T${formData.event_end_time}:00`;

      // Validate dates
      const startDate = new Date(startDatetime);
      const endDate = new Date(endDatetime);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Ungültige Datums- oder Zeitangaben');
      }

      if (startDate >= endDate) {
        throw new Error('Das Enddatum muss nach dem Startdatum liegen');
      }

      console.log('🔄 Updating event:', {
        id: event.id,
        title: formData.title,
        start_date: startDatetime,
        end_date: endDatetime,
        original_start: event.start_date,
        original_end: event.end_date
      });
      console.log('⏰ Time details:', {
        start_time: formData.event_start_time,
        end_time: formData.event_end_time,
        formatted_start: startDatetime,
        formatted_end: endDatetime
      });

      // Update title and date/time
      const result = await eventsAPI.update(event.id, {
        title: formData.title.trim(),
        start_date: startDatetime,
        end_date: endDatetime
      });

      console.log('✅ Event update result:', result);

      // Show success message
      setSuccess(true);
      
      // Call onSuccess immediately to refresh calendar
      if (onSuccess) {
        onSuccess();
      }
      
      // Wait a moment to show success message, then close
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);

    } catch (err) {
      console.error('❌ Error updating event:', err);
      setError(err.message || 'Fehler beim Aktualisieren des Events');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-2xl shadow-xl max-w-md w-full border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''}`}>
          <div>
            <h2 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
              {event?.title}
            </h2>
            <p className={`text-sm mt-1 text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
              Event bearbeiten
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 hover:opacity-70 transition-opacity rounded-lg text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              Event-Name *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
              placeholder="Event-Name eingeben"
            />
          </div>

          {/* Start */}
          <div>
            <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
              Von *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                name="event_start_date"
                value={formData.event_start_date}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
              />
              <input
                type="time"
                name="event_start_time"
                value={formData.event_start_time}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
              />
            </div>
          </div>

          {/* End */}
          <div>
            <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
              Bis *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                name="event_end_date"
                value={formData.event_end_date}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
              />
              <input
                type="time"
                name="event_end_time"
                value={formData.event_end_time}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className={`flex justify-end gap-3 pt-4 border-t border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''}`}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium rounded-lg border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''} transition-colors`}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${success ? 'bg-green-600' : 'bg-[#A58C81]'} ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} hover:opacity-90 disabled:opacity-50 flex items-center transition-opacity`}
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

