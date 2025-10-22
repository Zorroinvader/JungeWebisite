import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { eventsAPI } from '../../services/httpApi';
import { useDarkMode } from '../../contexts/DarkModeContext';

const QuickEventEditModal = ({ isOpen, onClose, onSuccess, event }) => {
  const { isDarkMode } = useDarkMode();
  
  const [formData, setFormData] = useState({
    event_start_date: '',
    event_start_time: '',
    event_end_date: '',
    event_end_time: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load event data
  useEffect(() => {
    if (event && isOpen) {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);

      setFormData({
        event_start_date: startDate.toISOString().split('T')[0],
        event_start_time: startDate.toTimeString().substring(0, 5),
        event_end_date: endDate.toISOString().split('T')[0],
        event_end_time: endDate.toTimeString().substring(0, 5)
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
    setLoading(true);

    try {
      // Combine date and time
      const startDatetime = `${formData.event_start_date}T${formData.event_start_time}:00`;
      const endDatetime = `${formData.event_end_date}T${formData.event_end_time}:00`;

      // Validate
      if (new Date(startDatetime) >= new Date(endDatetime)) {
        throw new Error('Das Enddatum muss nach dem Startdatum liegen');
      }

      // Update only date/time
      await eventsAPI.update(event.id, {
        start_date: startDatetime,
        end_date: endDatetime
      });

      if (onSuccess) onSuccess();
      if (onClose) onClose();

    } catch (err) {
      console.error('Error updating event:', err);
      setError(err.message || 'Fehler beim Aktualisieren');
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
              Zeit ändern
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
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} hover:opacity-90 disabled:opacity-50 flex items-center transition-opacity`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Speichern...
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

