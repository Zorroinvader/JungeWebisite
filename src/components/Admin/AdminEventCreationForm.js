// FILE OVERVIEW
// - Purpose: Admin form for creating new events directly in the calendar; includes conflict checking and validation.
// - Used by: AdminPanelClean when admin clicks "Event erstellen"; allows direct event creation without request workflow.
// - Notes: Production component. Admin-only; uses eventsAPI.create and eventValidation for conflict checking.

import React, { useState, useEffect } from 'react';
import { X, Plus, Copy } from 'lucide-react';
import { eventsAPI } from '../../services/databaseApi';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { checkEventConflicts, formatConflictMessage, validateEventTimes } from '../../utils/eventValidation';

const AdminEventCreationForm = ({ isOpen, onClose, onSuccess }) => {
  const { isDarkMode } = useDarkMode();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_start_date: '',
    event_start_time: '',
    event_end_date: '',
    event_end_time: '',
    is_private: false,
    location: 'Pferdestall Wedes-Wedel',
    event_type: 'Privates Event',
    is_recurring: false,
    recurrence_pattern: 'weekly',
    recurrence_interval: 1,
    recurrence_count: 4
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewDates, setPreviewDates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Load templates from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('event_templates');
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (e) {
      }
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleLoadTemplate = (e) => {
    const templateName = e.target.value;
    setSelectedTemplate(templateName);
    
    if (!templateName) return;
    
    const template = templates.find(t => t.name === templateName);
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.title,
        description: template.description || '',
        is_private: template.is_private || false,
        location: template.location || 'Pferdestall Wedes-Wedel',
        event_type: template.event_type || 'Privates Event',
        // Keep date/time empty for admin to fill
        event_start_date: '',
        event_start_time: '',
        event_end_date: '',
        event_end_time: ''
      }));
    }
  };

  const handleSaveAsTemplate = () => {
    const templateName = prompt('Vorlagenname eingeben:');
    if (!templateName) return;

    const newTemplate = {
      name: templateName,
      title: formData.title,
      description: formData.description,
      is_private: formData.is_private,
      location: formData.location,
      event_type: formData.event_type,
      created_at: new Date().toISOString()
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('event_templates', JSON.stringify(updatedTemplates));
    
    alert(`Vorlage "${templateName}" gespeichert!`);
  };

  // Generate recurring dates preview
  const generateRecurringDates = () => {
    if (!formData.is_recurring || !formData.event_start_date || !formData.event_start_time) {
      return [];
    }

    const dates = [];
    const startDate = new Date(`${formData.event_start_date}T${formData.event_start_time}:00`);
    const duration = formData.event_end_date && formData.event_end_time
      ? new Date(`${formData.event_end_date}T${formData.event_end_time}:00`) - startDate
      : 3600000; // Default 1 hour

    for (let i = 0; i < parseInt(formData.recurrence_count); i++) {
      const eventStart = new Date(startDate);
      
      if (formData.recurrence_pattern === 'weekly') {
        eventStart.setDate(startDate.getDate() + (i * 7 * parseInt(formData.recurrence_interval)));
      } else if (formData.recurrence_pattern === 'monthly') {
        eventStart.setMonth(startDate.getMonth() + (i * parseInt(formData.recurrence_interval)));
      }
      
      const eventEnd = new Date(eventStart.getTime() + duration);
      
      dates.push({
        start: eventStart,
        end: eventEnd
      });
    }

    return dates;
  };

  // Update preview when recurring settings change
  useEffect(() => {
    if (formData.is_recurring) {
      setPreviewDates(generateRecurringDates());
    } else {
      setPreviewDates([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.is_recurring, formData.event_start_date, formData.event_start_time, formData.event_end_date, formData.event_end_time, formData.recurrence_pattern, formData.recurrence_interval, formData.recurrence_count]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Bitte geben Sie einen Namen für die Veranstaltung ein');
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

      // Check for conflicts with existing events
      const existingEvents = await eventsAPI.getAll();
      const conflict = checkEventConflicts(existingEvents, {
        start_date: startDatetime,
        end_date: endDatetime
      });

      if (conflict.hasConflict) {
        const conflictMsg = formatConflictMessage(conflict.conflictingEvents);
        throw new Error(conflictMsg);
      }

      // Create event(s) - single or recurring
      if (formData.is_recurring) {
        // Create multiple events for recurring pattern
        const recurringDates = generateRecurringDates();
        
        if (recurringDates.length === 0) {
          throw new Error('Keine wiederkehrenden Termine generiert');
        }

        // Generate series ID for tracking
        const seriesId = `series_${Date.now()}`;

        // Create all events with series_id
        for (const dateRange of recurringDates) {
          const eventData = {
            title: formData.title,
            description: `${formData.description || ''} [Serie: ${seriesId}]`,
            start_date: dateRange.start.toISOString(),
            end_date: dateRange.end.toISOString(),
            is_private: formData.is_private,
            location: formData.location || 'Pferdestall Wedes-Wedel',
            event_type: formData.event_type || 'Privates Event',
            status: 'approved',
            additional_notes: `series_id:${seriesId}` // Store series ID
          };

          await eventsAPI.create(eventData);
        }

        alert(`${recurringDates.length} wiederkehrende Veranstaltungen erfolgreich erstellt!`);
      } else {
        // Single event
        const eventData = {
          title: formData.title,
          description: formData.description || '',
          start_date: startDatetime,
          end_date: endDatetime,
          is_private: formData.is_private,
          location: formData.location || 'Pferdestall Wedes-Wedel',
          event_type: formData.event_type || 'Privates Event',
          status: 'approved'
        };

        await eventsAPI.create(eventData);
      }

      // Success!
      if (onSuccess) onSuccess();
      if (onClose) onClose();

    } catch (err) {
      setError(err.message || 'Fehler beim Erstellen der Veranstaltung');
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
        className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain'
        }}
      >
        {/* MOBILE RESPONSIVE: Header with responsive padding */}
        <div className={`flex items-center justify-between p-4 sm:p-6 md:p-8 border-b border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''}`}>
          <div className="flex-1 min-w-0 pr-2">
            <h2 className={`text-lg sm:text-xl md:text-2xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} truncate`}>
              Neue Veranstaltung erstellen
            </h2>
            <p className={`text-xs sm:text-sm mt-1 text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
              Als Admin direkt Veranstaltung erstellen (keine Genehmigung erforderlich)
            </p>
          </div>
          <button
            onClick={onClose}
            className={`min-w-[44px] min-h-[44px] p-2 hover:opacity-70 active:scale-95 transition-all rounded-lg text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} touch-manipulation flex items-center justify-center flex-shrink-0`}
            aria-label="Schließen"
            style={{ touchAction: 'manipulation' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* MOBILE RESPONSIVE: Form with responsive padding */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          {error && (
            <div className={`rounded-lg p-4 bg-red-50 ${isDarkMode ? 'dark:bg-red-900/20' : ''} border border-red-200 ${isDarkMode ? 'dark:border-red-800' : ''}`}>
              <p className={`text-sm text-red-600 ${isDarkMode ? 'dark:text-red-400' : ''}`}>{error}</p>
            </div>
          )}

          {/* Template Selector */}
          {templates.length > 0 && (
            <div className={`bg-purple-50 ${isDarkMode ? 'dark:bg-purple-900/20' : ''} border border-purple-200 ${isDarkMode ? 'dark:border-purple-800' : ''} rounded-lg p-4`}>
              <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                Aus Vorlage laden
              </label>
              <select
                value={selectedTemplate}
                onChange={handleLoadTemplate}
                className={`w-full px-3 py-3 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6054d9] bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                style={{ fontSize: '16px' }}
              >
                <option value="">-- Vorlage auswählen --</option>
                {templates.map((template, index) => (
                  <option key={index} value={template.name}>
                    {template.name} ({template.event_type})
                  </option>
                ))}
              </select>
              <p className={`text-xs mt-1 text-purple-700 ${isDarkMode ? 'dark:text-purple-300' : ''}`}>
                Lädt Veranstaltungs-Details aus gespeicherten Vorlagen
              </p>
            </div>
          )}

          {/* Basic Information Section */}
          <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
            <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-1`}>
              Veranstaltungs-Informationen
            </h3>
            <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-4`}>
              Grundlegende Informationen zur Veranstaltung
            </p>

            <div className="space-y-4">
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
                  className={`w-full px-3 py-3 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} placeholder-gray-500 ${isDarkMode ? 'dark:placeholder-gray-400' : ''}`}
                  style={{ fontSize: '16px' }}
                  placeholder="z.B. Sommerveranstaltung, Vereinstreffen"
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
                  className={`w-full px-3 py-3 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} placeholder-gray-500 ${isDarkMode ? 'dark:placeholder-gray-400' : ''}`}
                  style={{ fontSize: '16px' }}
                  placeholder="Optionale Beschreibung der Veranstaltung..."
                />
              </div>
            </div>
          </div>

          {/* Date and Time Section */}
          <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
            <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-1`}>
              Zeitraum
            </h3>
            <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-4`}>
              Wann findet die Veranstaltung statt?
            </p>

            <div className="space-y-4">
              {/* Start Date/Time */}
              <div>
                <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Von (Startdatum) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    name="event_start_date"
                    value={formData.event_start_date}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                  />
                  <input
                    type="time"
                    name="event_start_time"
                    value={formData.event_start_time}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                  />
                </div>
              </div>

              {/* End Date/Time */}
              <div>
                <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Bis (Enddatum) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    name="event_end_date"
                    value={formData.event_end_date}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                  />
                  <input
                    type="time"
                    name="event_end_time"
                    value={formData.event_end_time}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recurring Events Section */}
          <div className={`border-l-4 border-[#6054d9] pl-4 py-2`}>
            <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-1`}>
              Wiederkehrende Veranstaltungen
            </h3>
            <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-4`}>
              Erstellen Sie eine Serie von Veranstaltungen automatisch
            </p>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_recurring"
                  name="is_recurring"
                  checked={formData.is_recurring}
                  onChange={handleChange}
                  className={`h-4 w-4 rounded border-gray-300 ${isDarkMode ? 'dark:border-gray-600' : ''} text-[#6054d9] focus:ring-[#6054d9]`}
                />
                <label htmlFor="is_recurring" className={`ml-3 block text-sm font-semibold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Serie von Veranstaltungen erstellen (z.B. jeden Montag)
                </label>
              </div>

              {formData.is_recurring && (
                <div className={`bg-blue-50 ${isDarkMode ? 'dark:bg-blue-900/20' : ''} border border-blue-200 ${isDarkMode ? 'dark:border-blue-800' : ''} rounded-lg p-4 space-y-4`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                        Muster
                      </label>
                      <select
                        name="recurrence_pattern"
                        value={formData.recurrence_pattern}
                        onChange={handleChange}
                        className={`w-full px-3 py-3 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6054d9] bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                style={{ fontSize: '16px' }}
                      >
                        <option value="weekly">Wöchentlich</option>
                        <option value="monthly">Monatlich</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                        Alle (Intervall)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="recurrence_interval"
                          value={formData.recurrence_interval}
                          onChange={handleChange}
                          min="1"
                          max="12"
                          className={`w-20 px-3 py-3 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6054d9] bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                        style={{ fontSize: '16px' }}
                        />
                        <span className={`text-sm text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                          {formData.recurrence_pattern === 'weekly' ? 'Woche(n)' : 'Monat(e)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                      Anzahl der Wiederholungen
                    </label>
                    <input
                      type="number"
                      name="recurrence_count"
                      value={formData.recurrence_count}
                      onChange={handleChange}
                      min="1"
                      max="52"
                      className={`w-32 px-3 py-3 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6054d9] bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                      style={{ fontSize: '16px' }}
                    />
                    <p className={`text-xs mt-1 text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
                      z.B. 4 = 4 Veranstaltungen werden erstellt
                    </p>
                  </div>

                  {/* Preview */}
                  {previewDates.length > 0 && (
                    <div>
                      <h4 className={`text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                        Vorschau ({previewDates.length} Veranstaltungen):
                      </h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {previewDates.map((date, index) => (
                          <div key={index} className={`text-xs px-2 py-1 bg-white ${isDarkMode ? 'dark:bg-gray-800' : ''} rounded border border-blue-200 ${isDarkMode ? 'dark:border-blue-700' : ''}`}>
                            <span className={`font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                              {index + 1}.
                            </span>{' '}
                            <span className={`text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
                              {date.start.toLocaleDateString('de-DE', { 
                                weekday: 'short', 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric' 
                              })} {date.start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                              {' → '}
                              {date.end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Event Settings Section */}
          <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
            <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-1`}>
              Veranstaltungs-Einstellungen
            </h3>
            <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-4`}>
              Zusätzliche Einstellungen
            </p>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Veranstaltungs-Typ
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="private_event_admin"
                      name="event_type"
                      value="Privates Event"
                      checked={formData.event_type === 'Privates Event'}
                      onChange={handleChange}
                      className={`h-4 w-4 focus:ring-2 focus:ring-opacity-50 border-gray-300 ${isDarkMode ? 'dark:border-gray-600' : ''} text-[#A58C81] ${isDarkMode ? 'dark:text-[#8a8a8a]' : ''} focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''}`}
                    />
                    <label htmlFor="private_event_admin" className={`ml-3 block text-sm font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                      Private Veranstaltung
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="public_event_admin"
                      name="event_type"
                      value="Öffentliches Event"
                      checked={formData.event_type === 'Öffentliches Event'}
                      onChange={handleChange}
                      className={`h-4 w-4 focus:ring-2 focus:ring-opacity-50 border-gray-300 ${isDarkMode ? 'dark:border-gray-600' : ''} text-[#A58C81] ${isDarkMode ? 'dark:text-[#8a8a8a]' : ''} focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''}`}
                    />
                    <label htmlFor="public_event_admin" className={`ml-3 block text-sm font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                      Öffentliche Veranstaltung
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_private"
                  name="is_private"
                  checked={formData.is_private}
                  onChange={handleChange}
                  className={`h-4 w-4 rounded border-gray-300 ${isDarkMode ? 'dark:border-gray-600' : ''} text-[#A58C81] ${isDarkMode ? 'dark:text-[#8a8a8a]' : ''} focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''}`}
                />
                <label htmlFor="is_private" className={`ml-3 block text-sm font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Im Kalender als "Privat" markieren (Details ausblenden)
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
                  className={`w-full px-3 py-3 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} placeholder-gray-500 ${isDarkMode ? 'dark:placeholder-gray-400' : ''}`}
                  style={{ fontSize: '16px' }}
                  placeholder="Pferdestall Wedes-Wedel"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          {/* MOBILE RESPONSIVE: Buttons stack on mobile, side-by-side on desktop */}
          <div className={`flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''}`}>
            <button
              type="button"
              onClick={handleSaveAsTemplate}
              disabled={!formData.title || loading}
              className={`w-full sm:w-auto px-4 py-3 min-h-[44px] text-base font-medium rounded-lg border-2 border-[#6054d9] text-[#6054d9] hover:bg-[#6054d9] hover:text-white active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation`}
              style={{ touchAction: 'manipulation' }}
            >
              <Copy className="h-4 w-4 mr-2 flex-shrink-0" />
              Als Vorlage speichern
            </button>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`w-full sm:w-auto px-6 py-3 min-h-[44px] text-base font-medium rounded-lg hover:opacity-80 active:scale-95 transition-all border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} bg-transparent hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''} touch-manipulation`}
                style={{ touchAction: 'manipulation' }}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`w-full sm:w-auto px-6 py-3 min-h-[44px] text-base font-medium text-white rounded-lg hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} hover:bg-[#8a6a5a] ${isDarkMode ? 'dark:hover:bg-[#8a8a8a]' : ''} touch-manipulation`}
                style={{ touchAction: 'manipulation' }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {formData.is_recurring ? `${previewDates.length} Veranstaltungen erstellen` : 'Veranstaltung erstellen'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEventCreationForm;

