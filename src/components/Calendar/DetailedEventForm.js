// FILE OVERVIEW
// - Purpose: Modal form for submitting detailed event information (step 2 of 3-step workflow) after initial request is accepted; includes PDF upload.
// - Used by: EventRequestTrackingPage when user clicks "Details ausfüllen" for an accepted request; also used in admin flows.
// - Notes: Production component. Submits via eventRequestsAPI.submitDetailedRequest; handles file uploads for signed contracts.

import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle } from 'lucide-react';
import { eventRequestsAPI, storageAPI } from '../../services/databaseApi';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { secureLog, sanitizeError } from '../../utils/secureConfig';
// Email notification is sent by submitDetailedRequest in databaseApi
// No need to import sendAdminNotification here

const DetailedEventForm = ({ request, isOpen, onClose, onSuccess }) => {
  const { isDarkMode } = useDarkMode();
  
  const [formData, setFormData] = useState({
    event_start_date: '',
    event_start_time: '',
    event_end_date: '',
    event_end_time: '',
    key_pickup_date: '',
    key_pickup_time: '',
    key_return_date: '',
    key_return_time: '',
    additional_notes: ''
  });

  const [contractFile, setContractFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if details are already submitted and prevent form from opening
  useEffect(() => {
    if (isOpen && request) {
      // If details are already submitted or stage is not initial_accepted, close the form and show message
      const isAlreadySubmitted = request.request_stage === 'details_submitted' || 
                                  request.request_stage === 'final_accepted' ||
                                  request.details_submitted_at ||
                                  (request.request_stage !== 'initial_accepted');
      
      if (isAlreadySubmitted) {
        setError('Die Details wurden bereits eingereicht. Sie können das Formular nicht erneut ausfüllen.');
        // Close after a short delay
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    }
  }, [isOpen, request, onClose]);

  // Pre-fill dates from requested_days if available
  useEffect(() => {
    if (request && request.requested_days) {
      try {
        const days = JSON.parse(request.requested_days);
        if (Array.isArray(days) && days.length > 0) {
          setFormData(prev => ({
            ...prev,
            event_start_date: days[0],
            event_end_date: days[days.length - 1],
            key_pickup_date: days[0],
            key_return_date: days[days.length - 1]
          }));
        }
      } catch (e) {
      }
    } else if (request && request.start_date) {
      const startDate = request.start_date.split('T')[0];
      const endDate = request.end_date ? request.end_date.split('T')[0] : startDate;
      setFormData(prev => ({
        ...prev,
        event_start_date: startDate,
        event_end_date: endDate,
        key_pickup_date: startDate,
        key_return_date: endDate
      }));
    }
  }, [request]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');
    
    if (file) {
      if (file.type !== 'application/pdf') {
        setFileError('Bitte laden Sie nur PDF-Dateien hoch.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFileError('Die Datei ist zu groß. Maximale Größe: 10MB');
        return;
      }
      setContractFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setUploadProgress(0);

    try {
      // Prevent submission if details are already submitted
      const isAlreadySubmitted = request.request_stage === 'details_submitted' || 
                                  request.request_stage === 'final_accepted' ||
                                  request.details_submitted_at ||
                                  (request.request_stage !== 'initial_accepted');
      
      if (isAlreadySubmitted) {
        throw new Error('Die Details wurden bereits eingereicht. Sie können das Formular nicht erneut ausfüllen.');
      }

      // Validate required fields
      if (!formData.event_start_date || !formData.event_start_time) {
        throw new Error('Bitte geben Sie Startdatum und -uhrzeit an');
      }

      if (!formData.event_end_date || !formData.event_end_time) {
        throw new Error('Bitte geben Sie Enddatum und -uhrzeit an');
      }

      if (!formData.key_pickup_date || !formData.key_pickup_time) {
        throw new Error('Bitte geben Sie Datum und Uhrzeit für Schlüsselannahme an');
      }

      if (!formData.key_return_date || !formData.key_return_time) {
        throw new Error('Bitte geben Sie Datum und Uhrzeit für Schlüsselrückgabe an');
      }

      if (!contractFile) {
        throw new Error('Bitte laden Sie den signierten Mietvertrag hoch');
      }

      // Combine date and time into datetime strings
      const exactStartDatetime = `${formData.event_start_date}T${formData.event_start_time}:00`;
      const exactEndDatetime = `${formData.event_end_date}T${formData.event_end_time}:00`;
      const keyHandoverDatetime = `${formData.key_pickup_date}T${formData.key_pickup_time}:00`;
      const keyReturnDatetime = `${formData.key_return_date}T${formData.key_return_time}:00`;

      // Validate dates
      const startDate = new Date(exactStartDatetime);
      const endDate = new Date(exactEndDatetime);
      const keyPickupDate = new Date(keyHandoverDatetime);
      const keyReturnDate = new Date(keyReturnDatetime);

      if (startDate >= endDate) {
        throw new Error('Das Enddatum muss nach dem Startdatum liegen');
      }

      if (keyPickupDate >= startDate) {
        throw new Error('Die Schlüsselannahme sollte vor dem Veranstaltungs-Start stattfinden');
      }

      if (keyReturnDate <= endDate) {
        throw new Error('Die Schlüsselrückgabe sollte nach dem Veranstaltungs-Ende stattfinden');
      }

      // Convert PDF to base64 FIRST (as backup - always store in DB)
      setUploadProgress(20);
      const arrayBuffer = await contractFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const contractBase64 = btoa(String.fromCharCode(...uint8Array));
      
      setUploadProgress(40);
      
      // Try to upload to storage (optional, will use DB if fails)
      let contractUrl = null;
      try {
        const uploadResult = await storageAPI.uploadSignedContract(contractFile, request.id);
        if (uploadResult.success) {
          contractUrl = uploadResult.url;
        }
      } catch (storageError) {
      }

      setUploadProgress(70);

      // Submit detailed request - ALWAYS include base64 data
      const detailedData = {
        exact_start_datetime: exactStartDatetime,
        exact_end_datetime: exactEndDatetime,
        key_handover_datetime: keyHandoverDatetime,
        key_return_datetime: keyReturnDatetime,
        schluesselannahme_time: formData.key_pickup_time,
        schluesselabgabe_time: formData.key_return_time,
        additional_notes: formData.additional_notes || '',
        signed_contract_url: contractUrl,
        uploaded_file_name: contractFile.name,
        uploaded_file_size: contractFile.size,
        uploaded_file_type: contractFile.type,
        uploaded_file_data: contractBase64
      };
      // Submit detailed request - this will also send admin notification
      const updatedRequest = await eventRequestsAPI.submitDetailedRequest(request.id, detailedData);
      
      // Verify the update was successful
      if (!updatedRequest) {
        throw new Error('Die Details konnten nicht gespeichert werden. Keine Antwort vom Server.');
      }
      
      if (updatedRequest.request_stage !== 'details_submitted') {
        throw new Error(`Die Details konnten nicht gespeichert werden. Status: ${updatedRequest.request_stage}`);
      }

      setUploadProgress(100);
      setSuccess(true);

      // Wait a bit longer to ensure database is updated before refreshing
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1500);

    } catch (err) {
      setError(err.message || 'Fehler beim Senden der Details');
      secureLog('error', '[DetailedEventForm] Submit error', { error: sanitizeError(err) });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !request) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4" style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
        <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full text-center border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}>
          <div className="text-green-500 text-6xl mb-4">
            <CheckCircle className="w-24 h-24 mx-auto" />
          </div>
          <h3 className={`text-2xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-2`}>
            Details eingereicht!
          </h3>
          <p className={`text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
            Ihre Veranstaltungs-Details wurden erfolgreich eingereicht. Ein Administrator wird Ihre Angaben überprüfen und die Veranstaltung endgültig freigeben.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4" style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
      <div 
        className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain'
        }}
      >
        {/* MOBILE RESPONSIVE: Header with responsive padding and proper close button */}
        <div className={`flex items-center justify-between p-4 sm:p-6 md:p-8 border-b border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''}`}>
          <div className="flex-1 min-w-0 pr-2">
            <h2 className={`text-lg sm:text-xl md:text-2xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} truncate`}>
              Veranstaltungs-Details vervollständigen
            </h2>
            <p className={`text-xs sm:text-sm mt-1 text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
              Event: <span className="font-semibold">{request?.event_name || request?.title}</span>
            </p>
            <p className={`text-xs sm:text-sm mt-1 text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
              Schritt 2 von 3: Geben Sie die genauen Zeiten an
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

        {/* MOBILE RESPONSIVE: Form with responsive padding and spacing */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          {error && (
            <div className={`rounded-lg p-4 bg-red-50 ${isDarkMode ? 'dark:bg-red-900/20' : ''} border border-red-200 ${isDarkMode ? 'dark:border-red-800' : ''}`}>
              <p className={`text-sm text-red-600 ${isDarkMode ? 'dark:text-red-400' : ''}`}>{error}</p>
            </div>
          )}

          {loading && uploadProgress > 0 && (
            <div className={`rounded-lg p-4 bg-blue-50 ${isDarkMode ? 'dark:bg-blue-900/20' : ''} border border-blue-200 ${isDarkMode ? 'dark:border-blue-800' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm text-blue-700 ${isDarkMode ? 'dark:text-blue-400' : ''}`}>
                  Wird verarbeitet...
                </span>
                <span className={`text-sm font-semibold text-blue-700 ${isDarkMode ? 'dark:text-blue-400' : ''}`}>
                  {uploadProgress}%
                </span>
              </div>
              <div className={`w-full bg-blue-200 ${isDarkMode ? 'dark:bg-blue-900' : ''} rounded-full h-2`}>
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Event Date and Time - Clear Section */}
          <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
            <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-1`}>
              Veranstaltungs-Zeitraum
            </h3>
            <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-4`}>
              Geben Sie die genauen Start- und Endzeiten Ihrer Veranstaltung an
            </p>
            
            {/* Start Date/Time */}
            <div className="mb-4">
              <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                Von (Startdatum) *
              </label>
              {/* MOBILE RESPONSIVE: Stack on mobile, side-by-side on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="date"
                  name="event_start_date"
                  value={formData.event_start_date}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-3 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                  style={{ fontSize: '16px' }}
                />
                <input
                  type="time"
                  name="event_start_time"
                  value={formData.event_start_time}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-3 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            {/* End Date/Time */}
            <div>
              <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                Bis (Enddatum) *
              </label>
              {/* MOBILE RESPONSIVE: Stack on mobile, side-by-side on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="date"
                  name="event_end_date"
                  value={formData.event_end_date}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-3 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                  style={{ fontSize: '16px' }}
                />
                <input
                  type="time"
                  name="event_end_time"
                  value={formData.event_end_time}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-3 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
          </div>

          {/* Key Handover Section - Clear Separator */}
          <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
            <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-1`}>
              Schlüsselübergabe
            </h3>
            <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-4`}>
              Diese Zeiten können an anderen Tagen stattfinden (keine Kalender-Blockierung)
            </p>

            {/* Key Pickup Date/Time */}
            <div className="mb-4">
              <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                Schlüsselannahme *
              </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                name="key_pickup_date"
                value={formData.key_pickup_date}
                onChange={handleChange}
                required
                className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
              />
              <input
                type="time"
                name="key_pickup_time"
                value={formData.key_pickup_time}
                onChange={handleChange}
                required
                className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
              />
              </div>
              <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mt-1`}>
                Wann holen Sie den Schlüssel ab?
              </p>
            </div>

            {/* Key Return Date/Time */}
            <div>
              <label className={`block text-sm font-semibold mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                Schlüsselrückgabe *
              </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                name="key_return_date"
                value={formData.key_return_date}
                onChange={handleChange}
                required
                className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
              />
              <input
                type="time"
                name="key_return_time"
                value={formData.key_return_time}
                onChange={handleChange}
                required
                className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''}`}
              />
              </div>
              <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mt-1`}>
                Wann bringen Sie den Schlüssel zurück?
              </p>
            </div>
          </div>

          {/* Signed Contract Upload - Clear Section */}
          <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
            <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-1`}>
              Mietvertrag hochladen
            </h3>
            <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-4`}>
              Bitte laden Sie den ausgefüllten und signierten Mietvertrag hoch (PDF, max 10MB)
            </p>
            
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} bg-gray-50 ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''}`}>
              <div className="space-y-2 text-center">
                <Upload className={`mx-auto h-12 w-12 text-[#A58C81] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`} />
                <div className={`flex text-sm text-gray-600 ${isDarkMode ? 'dark:text-gray-300' : ''}`}>
                  <label htmlFor="file-upload" className={`relative cursor-pointer bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-md font-medium hover:opacity-80 transition-opacity focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-opacity-50 text-[#A58C81] ${isDarkMode ? 'dark:text-[#8a8a8a]' : ''} focus-within:ring-[#A58C81] ${isDarkMode ? 'dark:focus-within:ring-[#8a8a8a]' : ''}`}>
                    <span>PDF-Datei auswählen</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="sr-only"
                      required
                    />
                  </label>
                  <p className="pl-1">oder per Drag & Drop</p>
                </div>
                <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>PDF bis zu 10MB</p>
                {fileError && (
                  <p className={`text-xs text-red-600 ${isDarkMode ? 'dark:text-red-400' : ''}`}>{fileError}</p>
                )}
                {contractFile && (
                  <p className={`text-xs text-green-600 ${isDarkMode ? 'dark:text-green-400' : ''}`}>
                    Datei ausgewählt: {contractFile.name} ({(contractFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Notes - Clear Section */}
          <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
            <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-1`}>
              Weitere Dinge
            </h3>
            <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-3`}>
              Optional: Zusätzliche Informationen oder besondere Wünsche
            </p>
            <textarea
              name="additional_notes"
              value={formData.additional_notes}
              onChange={handleChange}
              rows="4"
              className={`w-full px-3 py-3 min-h-[44px] text-base border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} placeholder-gray-500 ${isDarkMode ? 'dark:placeholder-gray-400' : ''}`}
              style={{ fontSize: '16px' }}
              placeholder="Zusätzliche Informationen, Wünsche oder Anmerkungen..."
            />
          </div>

          {/* Submit Buttons */}
          {/* MOBILE RESPONSIVE: Buttons stack on mobile, side-by-side on desktop */}
          <div className={`flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 pt-6 border-t border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''}`}>
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
                  Wird verarbeitet...
                </>
              ) : (
                'Details absenden'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DetailedEventForm;
