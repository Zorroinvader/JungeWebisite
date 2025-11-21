// FILE OVERVIEW
// - Purpose: Admin component for managing the 3-step event request workflow (initial → accepted → details submitted → final accepted).
// - Used by: AdminPanelClean as the main request management interface; handles all stages of event request approval.
// - Notes: Production component. Core admin tool; manages request stages, PDF downloads, and sends email notifications.

import React, { useState, useEffect } from 'react';
import { eventRequestsAPI } from '../../services/databaseApi';
import { CheckCircle, XCircle, Clock, Download, X } from 'lucide-react';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { sendUserNotification } from '../../utils/settingsHelper';
import { secureLog, sanitizeError } from '../../utils/secureConfig';

const ThreeStepRequestManagement = () => {
  const { isDarkMode } = useDarkMode();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Add timeout wrapper to prevent hanging
      const loadPromise = eventRequestsAPI.getAdminPanelData(50, 0);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Lade-Timeout')), 4000)
      );
      
      const data = await Promise.race([loadPromise, timeoutPromise]);
      
      // Handle different response formats
      let allRequests = [];
      
      if (Array.isArray(data)) {
        allRequests = data;
      } else if (data && typeof data === 'object') {
        // Might be { data: [...], error: null } format from Supabase
        if (Array.isArray(data.data)) {
          allRequests = data.data;
        } else if (data.data === null || data.data === undefined) {
          allRequests = [];
        }
      }
      
      // Sort by created_at, newest first
      allRequests.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB - dateA;
      });
      
      setRequests(allRequests);
      setLastUpdated(new Date());
    } catch (err) {
      secureLog('error', '[ThreeStepRequestManagement] Error loading requests', { error: sanitizeError(err) });
      setError(`Fehler beim Laden der Anfragen: ${err.message}`);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    
    // Auto-refresh every 30 seconds to catch updates (especially when user submits details)
    const interval = setInterval(() => {
      loadRequests();
    }, 30000);
    
    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000); // 3 second timeout
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper functions - Using your color palette
  const getStageColor = (stage) => {
    const colors = {
      'initial': 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500',
      'initial_accepted': 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500',
      'details_submitted': 'bg-purple-50 dark:bg-purple-900/10 border-l-4 border-purple-500',
      'final_accepted': 'bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500',
      'rejected': 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500'
    };
    return colors[stage] || 'bg-gray-50 border-l-4 border-gray-300';
  };

  const getStageLabel = (stage) => {
    const labels = {
      'initial': 'Schritt 1: Initiale Anfrage',
      'initial_accepted': 'Schritt 2: Warte auf Details',
      'details_submitted': 'Schritt 3: Details eingereicht',
      'final_accepted': 'Abgeschlossen',
      'rejected': 'Abgelehnt'
    };
    return labels[stage] || stage;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nicht verfügbar';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseRequestedDays = (daysString) => {
    if (!daysString) return 'Nicht verfügbar';
    try {
      const days = JSON.parse(daysString);
      if (Array.isArray(days) && days.length > 0) {
        const firstDay = new Date(days[0]).toLocaleDateString('de-DE');
        const lastDay = new Date(days[days.length - 1]).toLocaleDateString('de-DE');
        return `${firstDay} - ${lastDay}`;
      }
    } catch (e) {
      return daysString;
    }
    return 'Nicht verfügbar';
  };

  // Check if request was recently updated (within last 5 minutes)
  const isRecentlyUpdated = (request) => {
    if (!request.details_submitted_at && !request.initial_accepted_at && !request.final_accepted_at) {
      return false;
    }
    
    const updateTime = request.details_submitted_at || request.initial_accepted_at || request.final_accepted_at;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(updateTime) > fiveMinutesAgo;
  };

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'initial':
        return <Clock className="w-8 h-8" />;
      case 'initial_accepted':
        return <Clock className="w-8 h-8 animate-pulse" />;
      case 'details_submitted':
        return <CheckCircle className="w-8 h-8" />;
      case 'final_accepted':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-8 h-8" />;
      default:
        return <Clock className="w-8 h-8" />;
    }
  };

  // Request Card Component - Minimal design matching your color scheme
  const RequestCard = ({ request }) => {
    return (
      <div 
        onClick={() => {
          setSelectedRequest(request);
          setShowDetailModal(true);
        }}
        className={`${getStageColor(request.request_stage)} bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200 ${isDarkMode ? 'dark:border-gray-700' : ''} ${isRecentlyUpdated(request) ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className={`text-lg font-bold mb-1 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
              {request.event_name || request.title}
            </h3>
            <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-3`}>
              {getStageLabel(request.request_stage)}
              {isRecentlyUpdated(request) && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  🔄 Neu aktualisiert
                </span>
              )}
            </p>
            <div className={`text-xs space-y-1 text-gray-600 ${isDarkMode ? 'dark:text-gray-400' : ''}`}>
              <p>{request.requester_name}</p>
              <p>{parseRequestedDays(request.requested_days) || formatDate(request.start_date)}</p>
            </div>
          </div>
          
          <div className="ml-4">
            {getStageIcon(request.request_stage)}
          </div>
        </div>
      </div>
    );
  };

  // Detail Modal Component
  const DetailModal = ({ request }) => {
    const [localNotes, setLocalNotes] = useState('');
    const [localLoading, setLocalLoading] = useState(false);
    
    const handleLocalAcceptInitial = async () => {
      setLocalLoading(true);
      try {
        await eventRequestsAPI.acceptInitialRequest(request.id, localNotes);
        // Send email to user informing them to fill detailed form
        try {
          await sendUserNotification(request.requester_email, {
            title: request.title || request.event_name,
            event_name: request.title || request.event_name,
            requester_name: request.requester_name,
            requester_email: request.requester_email,
            start_date: request.start_date,
            end_date: request.end_date,
            event_type: request.event_type
          }, 'initial_request_accepted');
        } catch (emailErr) {
        }
        
        await loadRequests();
        setShowDetailModal(false);
        setSelectedRequest(null);
        alert('✅ Initiale Anfrage akzeptiert!\n\n• Der Zeitraum ist jetzt im Kalender blockiert\n• Der Benutzer wurde per E-Mail benachrichtigt\n• Der Benutzer kann nun die Details einreichen');
      } catch (err) {
        alert('Fehler beim Akzeptieren der Anfrage');
      } finally {
        setLocalLoading(false);
      }
    };

    const handleLocalReject = async () => {
      if (!localNotes.trim()) {
        alert('Bitte geben Sie einen Ablehnungsgrund an');
        return;
      }
      
      if (!window.confirm(`Sind Sie sicher, dass Sie diese Anfrage ablehnen möchten?\n\nEvent: ${request.event_name || request.title}\nAntragsteller: ${request.requester_name}\n\nDiese Aktion kann nicht rückgängig gemacht werden.`)) {
        return;
      }
      
      setLocalLoading(true);
      try {
        await eventRequestsAPI.rejectRequest(request.id, localNotes);
        await loadRequests();
        setShowDetailModal(false);
        setSelectedRequest(null);
        alert('❌ Anfrage abgelehnt. Der Benutzer wurde benachrichtigt.');
      } catch (err) {
        alert('Fehler beim Ablehnen der Anfrage');
      } finally {
        setLocalLoading(false);
      }
    };

    const handleLocalFinalAccept = async () => {
      if (!window.confirm('Hat der Benutzer bezahlt? Die Veranstaltung wird endgültig freigegeben und im Kalender eingetragen.')) {
        return;
      }
      
      setLocalLoading(true);
      try {
        await eventRequestsAPI.finalAcceptRequest(request.id);
        
        // Send email to user confirming final approval
        try {
          await sendUserNotification(request.requester_email, {
            title: request.title || request.event_name,
            event_name: request.title || request.event_name,
            requester_name: request.requester_name,
            requester_email: request.requester_email,
            start_datetime: request.exact_start_datetime,
            end_datetime: request.exact_end_datetime,
            start_date: request.start_date,
            end_date: request.end_date,
            event_type: request.event_type
          }, 'final_approval');
        } catch (emailErr) {
        }
        
        await loadRequests();
        setShowDetailModal(false);
        setSelectedRequest(null);
        
        // Trigger calendar refresh by dispatching custom event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('refreshCalendar'));
        }
        
        alert('✅ Veranstaltung final freigegeben!\n\n• Die Veranstaltung ist nun im Kalender sichtbar\n• Der temporäre Block wurde entfernt\n• Der Benutzer wurde per E-Mail benachrichtigt');
      } catch (err) {
        alert(`Fehler bei der finalen Freigabe:\n\n${err.message || err.toString()}\n\nBitte überprüfen Sie die Browser-Konsole für Details.`);
      } finally {
        setLocalLoading(false);
      }
    };

    const handleDownloadContract = async () => {
      try {
        // METHOD 1: Try Storage Bucket URL
        if (request.signed_contract_url) {
          try {
            const response = await fetch(request.signed_contract_url);
            if (response.ok) {
              window.open(request.signed_contract_url, '_blank');
              return;
            } else {
            }
          } catch (storageError) {
          }
        }
        
        // METHOD 2: Try Database Base64 Data
        if (request.uploaded_file_data) {
          try {
            const byteCharacters = atob(request.uploaded_file_data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: request.uploaded_file_type || 'application/pdf' });
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = request.uploaded_file_name || 'mietvertrag.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            return;
          } catch (base64Error) {
            throw new Error('Fehler beim Dekodieren der PDF-Daten: ' + base64Error.message);
          }
        }
        
        // If no data at all
        alert(
          '❌ Kein Vertrag verfügbar!\n\n' +
          'Der Benutzer hat noch keinen Vertrag hochgeladen.\n' +
          'Bitte warten Sie, bis der Benutzer die Details eingereicht hat.'
        );
      } catch (error) {
        alert('Fehler beim Herunterladen:\n\n' + error.message + '\n\nSiehe Browser-Konsole (F12) für Details.');
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4 overflow-y-auto"
        style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
      >
        {/* MOBILE RESPONSIVE: Detail modal with proper mobile sizing and touch-friendly interactions */}
        <div 
          className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-xl sm:rounded-2xl shadow-xl max-w-3xl w-full my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}
          style={{ 
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain'
          }}
        >
          {/* MOBILE RESPONSIVE: Sticky header with responsive padding */}
          <div className={`p-4 sm:p-6 md:p-8 border-b border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''} sticky top-0 bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} z-10`}>
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <h2 className={`text-lg sm:text-xl md:text-2xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} truncate`}>
                  {request.event_name || request.title}
                </h2>
                <p className={`text-xs sm:text-sm text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mt-1`}>
                  {getStageLabel(request.request_stage)}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }}
                className={`min-w-[44px] min-h-[44px] p-2 hover:opacity-70 active:scale-95 transition-all rounded-lg text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} touch-manipulation flex items-center justify-center flex-shrink-0`}
                aria-label="Schließen"
                style={{ touchAction: 'manipulation' }}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* MOBILE RESPONSIVE: Content with responsive padding */}
          <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            {/* Request Information */}
            <div className={`bg-gray-50 ${isDarkMode ? 'dark:bg-gray-900/50' : ''} rounded-lg p-4 border border-gray-200 ${isDarkMode ? 'dark:border-gray-700' : ''}`}>
              <h4 className={`font-semibold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-3 text-sm`}>Anfrageinformationen</h4>
              {/* MOBILE RESPONSIVE: Stack on mobile, 2 columns on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>Antragsteller:</p>
                  <p className={`font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} break-words`}>{request.requester_name}</p>
                </div>
                <div>
                  <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>E-Mail:</p>
                  <p className={`font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} break-all`}>{request.requester_email}</p>
                </div>
                {request.requester_phone && (
                  <div>
                    <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>Telefon:</p>
                    <p className={`font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>{request.requester_phone}</p>
                  </div>
                )}
                <div>
                  <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>Veranstaltungs-Typ:</p>
                  <p className={`font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                    {request.is_private ? 'Private Veranstaltung' : 'Öffentliche Veranstaltung'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>Zeitraum:</p>
                  <p className={`font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                    {parseRequestedDays(request.requested_days) || `${formatDate(request.start_date)} - ${formatDate(request.end_date)}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Initial Notes */}
            {request.initial_notes && (
              <div className={`bg-gray-50 ${isDarkMode ? 'dark:bg-gray-900/50' : ''} rounded-lg p-3 border border-gray-200 ${isDarkMode ? 'dark:border-gray-700' : ''}`}>
                <h4 className={`font-semibold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-1 text-sm`}>Initiale Anmerkungen</h4>
                <p className={`text-sm text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>{request.initial_notes}</p>
              </div>
            )}

            {/* Detailed Information (if available) */}
            {request.exact_start_datetime && (
              <div className={`bg-gray-50 ${isDarkMode ? 'dark:bg-gray-900/50' : ''} rounded-lg p-3 border border-gray-200 ${isDarkMode ? 'dark:border-gray-700' : ''}`}>
                <h4 className={`font-semibold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-2 text-sm`}>Detaillierte Zeiten:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>Veranstaltungs-Start:</p>
                    <p className={`font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>{formatDate(request.exact_start_datetime)}</p>
                  </div>
                  <div>
                    <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>Veranstaltungs-Ende:</p>
                    <p className={`font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>{formatDate(request.exact_end_datetime)}</p>
                  </div>
                  <div>
                    <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>Schlüsselannahme:</p>
                    <p className={`font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>{formatDate(request.key_handover_datetime)}</p>
                  </div>
                  <div>
                    <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>Schlüsselrückgabe:</p>
                    <p className={`font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>{formatDate(request.key_return_datetime)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Signed Contract */}
            {(request.signed_contract_url || request.uploaded_file_data) && (
              <div className={`bg-gray-50 ${isDarkMode ? 'dark:bg-gray-900/50' : ''} rounded-lg p-3 border border-gray-200 ${isDarkMode ? 'dark:border-gray-700' : ''}`}>
                <h4 className={`font-semibold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-2 text-sm`}>Signierter Mietvertrag</h4>
                <button
                  onClick={handleDownloadContract}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90 bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} hover:bg-[#8a6a5a] ${isDarkMode ? 'dark:hover:bg-[#8a8a8a]' : ''}`}
                >
                  <Download className="w-4 h-4" />
                  Vertrag herunterladen
                </button>
                {request.uploaded_file_name && (
                  <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mt-2`}>
                    {request.uploaded_file_name} ({request.uploaded_file_size ? (request.uploaded_file_size / 1024).toFixed(1) + ' KB' : ''})
                  </p>
                )}
              </div>
            )}

            {/* Additional Notes */}
            {request.additional_notes && (
              <div className={`bg-gray-50 ${isDarkMode ? 'dark:bg-gray-900/50' : ''} rounded-lg p-3 border border-gray-200 ${isDarkMode ? 'dark:border-gray-700' : ''}`}>
                <h4 className={`font-semibold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-1 text-sm`}>Zusätzliche Anmerkungen</h4>
                <p className={`text-sm text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>{request.additional_notes}</p>
              </div>
            )}

            {/* Admin Notes */}
            {request.admin_notes && (
              <div className={`bg-gray-50 ${isDarkMode ? 'dark:bg-gray-900/50' : ''} rounded-lg p-3 border border-gray-200 ${isDarkMode ? 'dark:border-gray-700' : ''}`}>
                <h4 className={`font-semibold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-1 text-sm`}>Admin-Notizen</h4>
                <p className={`text-sm text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>{request.admin_notes}</p>
              </div>
            )}

            {/* Rejection Reason */}
            {request.rejection_reason && (
              <div className={`bg-red-50 ${isDarkMode ? 'dark:bg-red-900/20' : ''} rounded-lg p-3 border border-red-200 ${isDarkMode ? 'dark:border-red-800' : ''}`}>
                <h4 className={`font-semibold text-red-900 ${isDarkMode ? 'dark:text-red-300' : ''} mb-1 text-sm`}>Ablehnungsgrund:</h4>
                <p className={`text-sm text-red-700 ${isDarkMode ? 'dark:text-red-400' : ''}`}>{request.rejection_reason}</p>
              </div>
            )}

            {/* Action Area - Matching form design */}
            {request.request_stage !== 'final_accepted' && request.request_stage !== 'rejected' && (
              <div className={`border-t border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''} pt-6 mt-4`}>
                <h4 className={`text-lg font-semibold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-4`}>Aktion durchführen</h4>
                
                {/* Notes/Reason Input - Same as form textarea */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                    Notizen / Ablehnungsgrund
                  </label>
                  <textarea
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    rows="4"
                    className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} placeholder-gray-500 ${isDarkMode ? 'dark:placeholder-gray-400' : ''}`}
                    placeholder={
                      request.request_stage === 'initial' 
                        ? 'Optional: Notizen für den Benutzer...'
                        : request.request_stage === 'details_submitted'
                        ? 'Optional: Notizen (z.B. Zahlungsbestätigung)...'
                        : 'Pflichtfeld: Grund für die Ablehnung...'
                    }
                  />
                  <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mt-1`}>
                    Sie können in jedem Schritt ablehnen
                  </p>
                </div>

                {/* Action Buttons - Same as form buttons */}
                <div className="flex justify-end space-x-4">
                  {/* STAGE 1: Initial Request */}
                  {request.request_stage === 'initial' && (
                    <>
                      <button
                        onClick={handleLocalReject}
                        disabled={localLoading}
                        className={`px-6 py-3 text-sm font-medium rounded-lg hover:opacity-80 transition-opacity border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} bg-transparent hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''}`}
                      >
                        ❌ Ablehnen
                      </button>
                      <button
                        onClick={handleLocalAcceptInitial}
                        disabled={localLoading}
                        className={`px-6 py-3 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} hover:bg-[#8a6a5a] ${isDarkMode ? 'dark:hover:bg-[#8a8a8a]' : ''}`}
                        title="Initiale Akzeptanz: Zeitraum wird blockiert, Benutzer kann Details einreichen"
                      >
                        {localLoading ? 'Wird akzeptiert...' : '✅ Initial akzeptieren'}
                      </button>
                    </>
                  )}

                  {/* STAGE 2: Waiting for User Details */}
                  {request.request_stage === 'initial_accepted' && (
                    <>
                      <div className={`flex-1 text-center py-3 bg-gray-100 ${isDarkMode ? 'dark:bg-gray-900/50' : ''} text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} rounded-lg text-sm font-medium border border-gray-200 ${isDarkMode ? 'dark:border-gray-700' : ''}`}>
                        ⏳ Warte auf Benutzer...
                      </div>
                      <button
                        onClick={handleLocalReject}
                        disabled={localLoading}
                        className={`px-6 py-3 text-sm font-medium rounded-lg hover:opacity-80 transition-opacity border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} bg-transparent hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''}`}
                      >
                        ❌ Ablehnen
                      </button>
                    </>
                  )}

                  {/* STAGE 3: Details Submitted */}
                  {request.request_stage === 'details_submitted' && (
                    <>
                      <button
                        onClick={handleLocalReject}
                        disabled={localLoading}
                        className={`px-6 py-3 text-sm font-medium rounded-lg hover:opacity-80 transition-opacity border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} bg-transparent hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''}`}
                      >
                        ❌ Ablehnen
                      </button>
                      <button
                        onClick={handleLocalFinalAccept}
                        disabled={localLoading}
                        className={`px-6 py-3 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} hover:bg-[#8a6a5a] ${isDarkMode ? 'dark:hover:bg-[#8a8a8a]' : ''}`}
                        title="Finale Freigabe: Veranstaltung wird im Kalender erstellt und Benutzer wird benachrichtigt"
                      >
                        {localLoading ? 'Wird freigegeben...' : '🎉 Final freigeben'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Completed Status */}
            {request.request_stage === 'final_accepted' && (
              <div className={`bg-gray-50 ${isDarkMode ? 'dark:bg-gray-900/50' : ''} border border-gray-200 ${isDarkMode ? 'dark:border-gray-700' : ''} rounded-lg p-3 text-center`}>
                <p className={`text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} font-semibold text-sm`}>
                  ✅ Event freigegeben am {formatDate(request.final_accepted_at)}
                </p>
              </div>
            )}

            {/* Rejected Status */}
            {request.request_stage === 'rejected' && (
              <div className={`bg-red-50 ${isDarkMode ? 'dark:bg-red-900/20' : ''} border border-red-200 ${isDarkMode ? 'dark:border-red-800' : ''} rounded-lg p-3 text-center`}>
                <p className={`text-red-800 ${isDarkMode ? 'dark:text-red-300' : ''} font-semibold text-sm`}>
                  ❌ Anfrage abgelehnt
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
            Anfragen
          </h2>
          <p className={`text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mt-1`}>
            {requests.length} Anfrage{requests.length !== 1 ? 'n' : ''} • Klicken für Details
            {lastUpdated && (
              <span className="ml-2 text-sm">
                • Letzte Aktualisierung: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadRequests}
            disabled={loading}
            className="px-4 py-2 bg-[#A58C81] text-white rounded-lg hover:bg-[#8B6F5F] disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Lädt...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Aktualisieren
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`bg-red-50 ${isDarkMode ? 'dark:bg-red-900/20' : ''} border border-red-200 ${isDarkMode ? 'dark:border-red-800' : ''} text-red-700 ${isDarkMode ? 'dark:text-red-400' : ''} px-4 py-3 rounded-lg`}>
          {error}
        </div>
      )}

      {/* Requests Grid */}
      {requests.length === 0 ? (
        <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-lg shadow p-12 text-center border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}>
          <Clock className={`w-16 h-16 text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mx-auto mb-4`} />
          <h3 className={`text-xl font-semibold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-2`}>
            Keine Anfragen vorhanden
          </h3>
          <p className={`text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
            Sobald Benutzer Veranstaltungs-Anfragen stellen, werden sie hier angezeigt.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <DetailModal request={selectedRequest} />
      )}
    </div>
  );
};

export default ThreeStepRequestManagement;
