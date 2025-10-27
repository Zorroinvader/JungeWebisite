import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Copy } from 'lucide-react';
import { eventsAPI } from '../../services/httpApi';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { checkEventConflicts, formatConflictMessage, validateEventTimes } from '../../utils/eventValidation';

const AdminEventEditForm = ({ isOpen, onClose, onSuccess, event, onSaveAsTemplate }) => {
  const { isDarkMode } = useDarkMode();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_start_date: '',
    event_start_time: '',
    event_end_date: '',
    event_end_time: '',
    is_private: false,
    location: '',
    event_type: 'Privates Event'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMode, setEditMode] = useState('single'); // 'single' or 'series'
  const [seriesId, setSeriesId] = useState(null);
  const [seriesEvents, setSeriesEvents] = useState([]);

  // Load event data and check for series
  useEffect(() => {
    const loadEventData = async () => {
      if (event && isOpen) {
        // Validate and safely parse dates
        const startDate = event.start_date ? new Date(event.start_date) : new Date();
        const endDate = event.end_date ? new Date(event.end_date) : new Date();
        
        // Check if dates are valid
        const isValidStartDate = !isNaN(startDate.getTime());
        const isValidEndDate = !isNaN(endDate.getTime());
        
        // Use current date/time as fallback for invalid dates
        const safeStartDate = isValidStartDate ? startDate : new Date();
        const safeEndDate = isValidEndDate ? endDate : new Date();

        setFormData({
          title: event.title || '',
          description: event.description || '',
          event_start_date: safeStartDate.toISOString().split('T')[0],
          event_start_time: safeStartDate.toTimeString().substring(0, 5),
          event_end_date: safeEndDate.toISOString().split('T')[0],
          event_end_time: safeEndDate.toTimeString().substring(0, 5),
          is_private: event.is_private || false,
          location: event.location || '',
          event_type: event.event_type || 'Privates Event'
        });

        // Check if this event is part of a series
        const seriesMatch = event.additional_notes?.match(/series_id:([^\s]+)/);
        if (seriesMatch) {
          const sid = seriesMatch[1];
          setSeriesId(sid);
          
          // Load all events in this series
          try {
            const allEvents = await eventsAPI.getAll();
            const relatedEvents = allEvents.filter(e => 
              e.additional_notes?.includes(`series_id:${sid}`)
            );
            setSeriesEvents(relatedEvents);
          } catch (error) {
            console.error('Error loading series events:', error);
          }
        } else {
          setSeriesId(null);
          setSeriesEvents([]);
        }
      }
    };

    loadEventData();
  }, [event, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Bitte geben Sie einen Event-Namen ein');
      }

      if (!formData.event_start_date || !formData.event_start_time) {
        throw new Error('Bitte geben Sie Startdatum und -uhrzeit an');
      }

      if (!formData.event_end_date || !formData.event_end_time) {
        throw new Error('Bitte geben Sie Enddatum und -uhrzeit an');
      }

      // Combine date and time
      const startDatetime = `${formData.event_start_date}T${formData.event_start_time}:00`;
      const endDatetime = `${formData.event_end_date}T${formData.event_end_time}:00`;

      // Validate dates
      const startDate = new Date(startDatetime);
      const endDate = new Date(endDatetime);

      const timeValidation = validateEventTimes(startDate, endDate);
      if (!timeValidation.isValid) {
        throw new Error(timeValidation.error);
      }

      // Check for conflicts with existing events (excluding current event being edited)
      const existingEvents = await eventsAPI.getAll();
      const conflict = checkEventConflicts(existingEvents, {
        start_date: startDatetime,
        end_date: endDatetime
      }, editMode === 'single' ? event.id : null);

      if (conflict.hasConflict) {
        const conflictMsg = formatConflictMessage(conflict.conflictingEvents);
        throw new Error(conflictMsg);
      }

      // Update event(s) - single or series
      const eventData = {
        title: formData.title,
        description: formData.description || '',
        start_date: startDatetime,
        end_date: endDatetime,
        is_private: formData.is_private,
        location: formData.location || 'Pferdestall Wedes-Wedel',
        event_type: formData.event_type || 'Privates Event'
      };

      if (editMode === 'series' && seriesId && seriesEvents.length > 1) {
        // Update all events in series
        const timeDiff = new Date(startDatetime) - new Date(event.start_date);
        
        for (const seriesEvent of seriesEvents) {
          const newStart = new Date(new Date(seriesEvent.start_date).getTime() + timeDiff);
          const newEnd = new Date(new Date(seriesEvent.end_date).getTime() + timeDiff);
          
          await eventsAPI.update(seriesEvent.id, {
            ...eventData,
            start_date: newStart.toISOString(),
            end_date: newEnd.toISOString()
          });
        }
        
        alert(`${seriesEvents.length} Events der Serie wurden aktualisiert!`);
      } else {
        // Update only this event
        await eventsAPI.update(event.id, eventData);
      }

      // Success!
      if (onSuccess) onSuccess();
      if (onClose) onClose();

    } catch (err) {
      console.error('Error updating event:', err);
      setError(err.message || 'Fehler beim Aktualisieren des Events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await eventsAPI.delete(event.id);
      setShowDeleteConfirm(false);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err.message || 'Fehler beim Löschen des Events');
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = () => {
    if (onSaveAsTemplate) {
      onSaveAsTemplate({
        title: formData.title,
        description: formData.description,
        duration: new Date(`${formData.event_end_date}T${formData.event_end_time}:00`) - new Date(`${formData.event_start_date}T${formData.event_start_time}:00`),
        is_private: formData.is_private,
        location: formData.location,
        event_type: formData.event_type
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-8 border-b border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''}`}>
          <div>
            <h2 className={`text-2xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
              Event bearbeiten
            </h2>
            <p className={`text-sm mt-1 text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
              Ändern Sie die Event-Details
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 hover:opacity-70 transition-opacity rounded-lg text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className={`rounded-lg p-4 bg-red-50 ${isDarkMode ? 'dark:bg-red-900/20' : ''} border border-red-200 ${isDarkMode ? 'dark:border-red-800' : ''}`}>
              <p className={`text-sm text-red-600 ${isDarkMode ? 'dark:text-red-400' : ''}`}>{error}</p>
            </div>
          )}

          {/* Series Edit Mode Selector */}
          {seriesId && seriesEvents.length > 1 && (
            <div className={`bg-purple-50 ${isDarkMode ? 'dark:bg-purple-900/20' : ''} border border-purple-200 ${isDarkMode ? 'dark:border-purple-800' : ''} rounded-lg p-4`}>
              <h4 className={`text-sm font-semibold mb-3 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                Dieses Event ist Teil einer Serie ({seriesEvents.length} Events)
              </h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="edit_single"
                    name="editMode"
                    value="single"
                    checked={editMode === 'single'}
                    onChange={(e) => setEditMode(e.target.value)}
                    className={`h-4 w-4 text-[#6054d9] focus:ring-[#6054d9]`}
                  />
                  <label htmlFor="edit_single" className={`ml-3 text-sm font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                    Nur dieses Event bearbeiten
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="edit_series"
                    name="editMode"
                    value="series"
                    checked={editMode === 'series'}
                    onChange={(e) => setEditMode(e.target.value)}
                    className={`h-4 w-4 text-[#6054d9] focus:ring-[#6054d9]`}
                  />
                  <label htmlFor="edit_series" className={`ml-3 text-sm font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                    Gesamte Serie bearbeiten ({seriesEvents.length} Events)
                  </label>
                </div>
              </div>
              {editMode === 'series' && (
                <p className={`text-xs mt-2 text-purple-700 ${isDarkMode ? 'dark:text-purple-300' : ''}`}>
                  Alle {seriesEvents.length} Events werden mit derselben Zeitverschiebung aktualisiert
                </p>
              )}
            </div>
          )}

          {/* Basic Information */}
          <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
            <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-4`}>
              Event-Informationen
            </h3>

            <div className="space-y-4">
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
                  className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Beschreibung
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
            <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-4`}>
              Zeitraum
            </h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Von *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    name="event_start_date"
                    value={formData.event_start_date}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                  />
                  <input
                    type="time"
                    name="event_start_time"
                    value={formData.event_start_time}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Bis *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    name="event_end_date"
                    value={formData.event_end_date}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                  />
                  <input
                    type="time"
                    name="event_end_time"
                    value={formData.event_end_time}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
            <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-4`}>
              Einstellungen
            </h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Event-Typ
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="private_event_edit"
                      name="event_type"
                      value="Privates Event"
                      checked={formData.event_type === 'Privates Event'}
                      onChange={handleChange}
                      className={`h-4 w-4 text-[#A58C81] focus:ring-[#A58C81]`}
                    />
                    <label htmlFor="private_event_edit" className={`ml-3 text-sm font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                      Privates Event
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="public_event_edit"
                      name="event_type"
                      value="Öffentliches Event"
                      checked={formData.event_type === 'Öffentliches Event'}
                      onChange={handleChange}
                      className={`h-4 w-4 text-[#A58C81] focus:ring-[#A58C81]`}
                    />
                    <label htmlFor="public_event_edit" className={`ml-3 text-sm font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                      Öffentliches Event
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_private_edit"
                  name="is_private"
                  checked={formData.is_private}
                  onChange={handleChange}
                  className={`h-4 w-4 rounded text-[#A58C81] focus:ring-[#A58C81]`}
                />
                <label htmlFor="is_private_edit" className={`ml-3 text-sm font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Im Kalender als "Privat" markieren
                </label>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Ort
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex justify-between pt-6 border-t border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''}`}>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveTemplate}
                className={`px-4 py-2 text-sm font-medium rounded-lg border-2 border-[#6054d9] text-[#6054d9] hover:bg-[#6054d9] hover:text-white transition-colors flex items-center`}
              >
                <Copy className="h-4 w-4 mr-2" />
                Als Vorlage speichern
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium rounded-lg border-2 border-red-500 ${isDarkMode ? 'dark:border-red-400' : ''} text-red-600 ${isDarkMode ? 'dark:text-red-400' : ''} hover:bg-red-50 ${isDarkMode ? 'dark:hover:bg-red-900/20' : ''} transition-colors flex items-center`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`px-6 py-3 text-sm font-medium rounded-lg border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''} transition-colors`}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center transition-opacity bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''}`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Änderungen speichern
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-xl shadow-xl max-w-md w-full p-8 border-2 border-red-500`}>
            <h3 className={`text-xl font-bold text-red-600 mb-4`}>
              Event löschen?
            </h3>
            <p className={`text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} mb-6`}>
              Möchten Sie das Event "<strong>{formData.title}</strong>" wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className={`flex-1 px-6 py-3 border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} rounded-lg hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''} transition-colors font-semibold`}
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className={`flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50`}
              >
                {loading ? 'Wird gelöscht...' : 'Ja, löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventEditForm;

