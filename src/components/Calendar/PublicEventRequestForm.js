import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Mail } from 'lucide-react';
import { eventRequestsAPI, profileAPI } from '../../services/httpApi';
import { useAuth } from '../../contexts/AuthContext';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { sendAdminNotification, sendUserNotification, areNotificationsEnabled } from '../../utils/settingsHelper';

const PublicEventRequestForm = ({ isOpen, onClose, onSuccess, selectedDate, userData }) => {
  const { user } = useAuth();
  const { isDarkMode } = useDarkMode();
  
  const [formData, setFormData] = useState({
    title: '',
    requester_name: '',
    requester_email: '',
    requester_phone: '',
    start_date: '',
    end_date: '',
    event_type: 'Privates Event',
    additional_notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Helper function to format date in local timezone (like your old code)
  const formatDateLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Auto-fill user data when user is logged in
  useEffect(() => {
    const fetchProfileData = async () => {
      if (userData && userData.id) {
        try {
          const profile = await profileAPI.getProfile(userData.id);
          if (profile) {
            setFormData(prev => ({
              ...prev,
              requester_name: profile.full_name || '',
              requester_email: profile.email || userData.email || '',
              requester_phone: profile.phone || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching profile data:', error);
          // Fallback to basic user data
          setFormData(prev => ({
            ...prev,
            requester_email: userData.email || ''
          }));
        }
      }
    };

    if (isOpen) {
      fetchProfileData();
    }
  }, [userData, isOpen]);

  // Update form data when selectedDate changes (from calendar click)
  useEffect(() => {
    if (selectedDate && isOpen) {
      let startDateString = '';
      let endDateString = '';
      
      // Handle different selectedDate formats
      if (selectedDate.start) {
        startDateString = formatDateLocal(selectedDate.start);
        endDateString = formatDateLocal(selectedDate.end || selectedDate.start);
      } else if (selectedDate instanceof Date) {
        startDateString = formatDateLocal(selectedDate);
        endDateString = formatDateLocal(selectedDate);
      } else if (typeof selectedDate === 'string') {
        startDateString = selectedDate;
        endDateString = selectedDate;
      }
      
      if (startDateString) {
        setFormData(prev => ({
          ...prev,
          start_date: startDateString,
          end_date: endDateString
        }));
      }
    }
  }, [selectedDate, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        requester_name: '',
        requester_email: '',
        requester_phone: '',
        start_date: '',
        end_date: '',
        event_type: 'Privates Event',
        additional_notes: ''
      });
      setError('');
      setSuccess(false);
      setSubmissionResult(null);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Bitte geben Sie einen Event-Namen ein');
      return false;
    }
    if (!formData.requester_name.trim()) {
      setError('Bitte geben Sie Ihren Namen ein');
      return false;
    }
    if (!formData.requester_email.trim()) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein');
      return false;
    }
    if (!formData.start_date) {
      setError('Bitte wählen Sie ein Startdatum aus');
      return false;
    }
    if (!formData.end_date) {
      setError('Bitte wählen Sie ein Enddatum aus');
      return false;
    }
    if (formData.start_date > formData.end_date) {
      setError('Das Enddatum muss nach dem Startdatum liegen');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 Form submit button clicked!');
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    console.log('✅ Form validation passed, starting submission...');
    setLoading(true);
    setError('');

    try {
      console.log('📝 Preparing request data...')
      
      // Generate date range array
      const dateRange = [];
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        dateRange.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log('📅 Date range:', dateRange);

      // Create request data matching existing structure
      const requestData = {
        title: formData.title,
        event_name: formData.title, // Also store in event_name for new workflow
        description: formData.additional_notes || '',
        requester_name: formData.requester_name,
        requester_email: formData.requester_email,
        requester_phone: formData.requester_phone || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        requested_days: JSON.stringify(dateRange), // New field
        is_private: formData.event_type === 'Privates Event',
        event_type: formData.event_type,
        initial_notes: formData.additional_notes || '', // New field
        status: 'pending',
        request_stage: 'initial', // New field for 3-step workflow
        created_at: new Date().toISOString(),
        // Add user ID for logged-in users
        requested_by: user?.id || null,
        created_by: user?.id || null
      };

      console.log('📤 Calling eventRequestsAPI.createInitialRequest...')
      
      // Try the API with a short timeout (3 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 3 seconds')), 3000)
      )
      
      const requestPromise = eventRequestsAPI.createInitialRequest(requestData)
      
      console.log('⏳ Waiting for API response...')
      let result
      try {
        result = await Promise.race([requestPromise, timeoutPromise])
        console.log('✅ Event request created successfully:', result)
      } catch (apiError) {
        // If API fails, use fallback immediately
        throw new Error('API_TIMEOUT')
      }

      // Send notifications asynchronously without blocking the success message
      setSubmissionResult(result);
      setSuccess(true);
      setLoading(false);

      // Send notification to admins about new initial request (async, don't wait)
      if (areNotificationsEnabled()) {
        console.log('📧 Scheduling admin notification...')
        sendAdminNotification(result, 'initial_request').catch(err => {
          console.error('❌ Admin notification failed (non-blocking):', err);
        });
      }

      // Send confirmation email to the user (async, don't wait)
      console.log('📧 Scheduling user notification...')
      sendUserNotification(formData.requester_email, result, 'initial_request_received').catch(err => {
        console.error('❌ User notification failed (non-blocking):', err);
      });
      
      // Don't auto-close - let user close manually when ready

    } catch (err) {
      console.error('Error submitting request:', err);
      // Fallback: use HTTP REST API for insert (more reliable)
      if (err.message === 'API_TIMEOUT' || true) {
        try {
          console.log('🛟 Using fast HTTP REST API for insert...')
          const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
          const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

          const fallbackData = {
            title: formData.title,
            description: formData.additional_notes || '',
            requester_name: formData.requester_name,
            requester_email: formData.requester_email,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_private: formData.event_type === 'Privates Event',
            event_type: formData.event_type,
            status: 'pending',
            created_at: new Date().toISOString(),
            event_name: formData.title,
            requester_phone: formData.requester_phone || null,
            requested_days: JSON.stringify([formData.start_date, formData.end_date]),
            initial_notes: formData.additional_notes || '',
            request_stage: 'initial',
            requested_by: user?.id || null,
            created_by: user?.id || null
          }

          console.log('📤 POSTing to Supabase REST API...')
          const response = await fetch(`${supabaseUrl}/rest/v1/event_requests`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(fallbackData)
          })

          if (!response.ok) {
            const text = await response.text()
            console.error('❌ HTTP error:', text)
            throw new Error(`HTTP ${response.status}: ${text}`)
          }

          const result = await response.json()
          const created = Array.isArray(result) ? result[0] : result
          console.log('✅ HTTP REST API insert success:', created)

          // Show success immediately
          setSubmissionResult(created)
          setSuccess(true)
          setLoading(false)

          // Fire notifications asynchronously (don't wait for them)
          if (areNotificationsEnabled()) {
            console.log('📧 Scheduling admin notification...')
            sendAdminNotification(created, 'initial_request').catch(err => {
              console.error('❌ Admin notification failed (non-blocking):', err)
            })
          }
          console.log('📧 Scheduling user notification...')
          sendUserNotification(formData.requester_email, {
            ...created,
            requester_name: formData.requester_name,
            event_name: formData.title,
            event_type: formData.event_type
          }, 'initial_request_received').catch(err => {
            console.error('❌ User notification failed (non-blocking):', err)
          })
        } catch (fallbackError) {
          console.error('❌ Fallback insert failed:', fallbackError)
          setError(err.message || 'Fehler beim Senden der Anfrage')
          setLoading(false)
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
      <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-2xl shadow-xl max-w-2xl w-full max-h-[70vh] overflow-y-auto border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''} relative`}>

        <div className={`flex items-center justify-between p-8 border-b border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''}`}>
          <div>
            <h2 className={`text-2xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
              Event anfragen
            </h2>
            <p className={`text-sm mt-1 text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
              Schritt 1 von 3: Stellen Sie eine erste Anfrage
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

          {success && (
            <div className={`rounded-lg p-6 bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} relative`}>
              {/* Close button */}
              <button
                onClick={() => {
                  if (onSuccess && submissionResult) onSuccess(submissionResult);
                  if (onClose) onClose();
                  // Reset form
                  setFormData({
                    title: '',
                    requester_name: '',
                    requester_email: '',
                    requester_phone: '',
                    start_date: '',
                    end_date: '',
                    event_type: 'Privates Event',
                    additional_notes: ''
                  });
                  setSuccess(false);
                  setError('');
                  setSubmissionResult(null);
                }}
                className={`absolute top-4 right-4 p-2 hover:opacity-70 transition-opacity rounded-lg text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}
                aria-label="Schließen"
                title="Schließen"
              >
                <X size={24} />
              </button>
              
              <div className="text-center mb-6">
                <CheckCircle className={`h-16 w-16 mx-auto text-green-500 mb-4`} />
                <h3 className={`text-2xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-2`}>
                  Anfrage erfolgreich eingereicht!
                </h3>
                <p className={`text-sm text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
                  Ihre Event-Anfrage wurde empfangen und wird bearbeitet
                </p>
              </div>

              <div className={`border-l-4 border-green-500 pl-4 py-3 mb-6 bg-green-50 ${isDarkMode ? 'dark:bg-green-900/20' : ''}`}>
                <h4 className={`font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-2`}>
                  Status
                </h4>
                <ul className={`space-y-2 text-sm text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Ihre Anfrage wurde eingereicht
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Der gewünschte Zeitraum ist vorläufig für Sie reserviert
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Ein Administrator prüft Ihre Anfrage
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Eine Bestätigungs-E-Mail wurde an {formData.requester_email} gesendet
                  </li>
                </ul>
              </div>

              <div className={`border-l-4 border-[#6054d9] pl-4 py-3 mb-6`}>
                <h4 className={`font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-2`}>
                  Nächste Schritte
                </h4>
                <ol className={`space-y-2 text-sm text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} list-decimal list-inside`}>
                  <li>Ein Administrator prüft Ihre Anfrage</li>
                  <li>Sie erhalten eine E-Mail, sobald Ihre Anfrage akzeptiert wurde</li>
                  <li>Danach können Sie die detaillierten Informationen ergänzen</li>
                  <li>Nach finaler Genehmigung ist Ihr Event im Kalender aktiv</li>
                </ol>
              </div>

              <div className={`text-center pt-4 border-t border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''}`}>
                <p className={`text-sm text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-3`}>
                  Sie können den Status Ihrer Anfrage jederzeit verfolgen
                </p>
                <a
                  href="/event-tracking"
                  className={`inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-[#6054d9] hover:bg-[#4f44c7] rounded-lg transition-colors shadow-md`}
                >
                  Status verfolgen
                </a>
              </div>
            </div>
          )}

          {!success && (
          <>
          {/* Basic Information Section */}
          <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
            <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-1`}>
              Grundinformationen
            </h3>
            <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-4`}>
              Bitte geben Sie die grundlegenden Informationen zu Ihrem Event an
            </p>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Name des Events *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} placeholder-gray-500 ${isDarkMode ? 'dark:placeholder-gray-400' : ''}`}
                  placeholder="z.B. Geburtstag, Hochzeit, Firmenfeier"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                    Ihr Name *
                  </label>
                  <input
                    type="text"
                    name="requester_name"
                    value={formData.requester_name}
                    onChange={handleChange}
                    className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} placeholder-gray-500 ${isDarkMode ? 'dark:placeholder-gray-400' : ''}`}
                    placeholder="Max Mustermann"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                    E-Mail-Adresse *
                  </label>
                  <input
                    type="email"
                    name="requester_email"
                    value={formData.requester_email}
                    onChange={handleChange}
                    className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} placeholder-gray-500 ${isDarkMode ? 'dark:placeholder-gray-400' : ''}`}
                    placeholder="max@beispiel.de"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Telefonnummer (optional)
                </label>
                <input
                  type="tel"
                  name="requester_phone"
                  value={formData.requester_phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} placeholder-gray-500 ${isDarkMode ? 'dark:placeholder-gray-400' : ''}`}
                  placeholder="+49 123 456789"
                />
              </div>
            </div>
          </div>

          {/* Date Selection Section */}
          <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
            <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-1`}>
              Gewünschter Zeitraum
            </h3>
            <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-4`}>
              Wählen Sie die Tage aus, an denen Sie das Event planen
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Von (Startdatum) *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Bis (Enddatum) *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                  required
                />
              </div>
            </div>
          </div>

          {/* Event Type Section */}
          <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
            <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-1`}>
              Event-Typ
            </h3>
            <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-4`}>
              Wählen Sie aus, ob Ihr Event privat oder öffentlich sein soll
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="private_event"
                  name="event_type"
                  value="Privates Event"
                  checked={formData.event_type === 'Privates Event'}
                  onChange={handleChange}
                  className={`h-4 w-4 focus:ring-2 focus:ring-opacity-50 border-gray-300 ${isDarkMode ? 'dark:border-gray-600' : ''} text-[#A58C81] ${isDarkMode ? 'dark:text-[#8a8a8a]' : ''} focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''}`}
                />
                <label htmlFor="private_event" className={`ml-3 block text-sm font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Privates Event
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="public_event"
                  name="event_type"
                  value="Öffentliches Event"
                  checked={formData.event_type === 'Öffentliches Event'}
                  onChange={handleChange}
                  className={`h-4 w-4 focus:ring-2 focus:ring-opacity-50 border-gray-300 ${isDarkMode ? 'dark:border-gray-600' : ''} text-[#A58C81] ${isDarkMode ? 'dark:text-[#8a8a8a]' : ''} focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''}`}
                />
                <label htmlFor="public_event" className={`ml-3 block text-sm font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  Öffentliches Event
                </label>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
            <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-1`}>
              Anmerkungen
            </h3>
            <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-3`}>
              Optional: Beschreiben Sie Ihr Event und besondere Anforderungen
            </p>
            
            <textarea
              name="additional_notes"
              value={formData.additional_notes}
              onChange={handleChange}
              rows="4"
              className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} placeholder-gray-500 ${isDarkMode ? 'dark:placeholder-gray-400' : ''}`}
              placeholder="Zusätzliche Informationen, Wünsche oder Anmerkungen..."
            />
          </div>

          <div className={`flex justify-end space-x-4 pt-6 border-t border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 text-sm font-medium rounded-lg hover:opacity-80 transition-opacity border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} bg-transparent hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''}`}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} hover:bg-[#8a6a5a] ${isDarkMode ? 'dark:hover:bg-[#8a8a8a]' : ''}`}
            >
              {loading ? 'Wird gesendet...' : 'Anfrage absenden'}
            </button>
          </div>
          </>
          )}
        </form>
      </div>
    </div>
  );
};

export default PublicEventRequestForm;
