// FILE OVERVIEW
// - Purpose: Component displaying user's event requests with timeline, status, and action buttons (fill details, cancel).
// - Used by: ProfilePage to show all event requests for the logged-in user; displays RequestTimeline for each request.
// - Notes: Production component. Loads requests via eventRequestsAPI.getByUser; handles cancellation and detail submission flows.

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { eventRequestsAPI } from '../../services/databaseApi';
import RequestTimeline from '../Calendar/RequestTimeline';
import DetailedEventForm from '../Calendar/DetailedEventForm';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const MyEventRequests = () => {
  const { user } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState(null);

  const loadMyRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Get requests by user ID or email
      const data = await eventRequestsAPI.getByUser(user.id);
      
      // Sort by created_at, newest first
      data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setRequests(data || []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMyRequests();
  }, [user, loadMyRequests]);

  const handleFillDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailedForm(true);
  };

  const handleDetailsSubmitted = () => {
    setShowDetailedForm(false);
    setSelectedRequest(null);
    loadMyRequests();
  };

  const handleCancelRequest = (request) => {
    setRequestToCancel(request);
    setShowCancelConfirm(true);
  };

  const confirmCancelRequest = async () => {
    if (!requestToCancel) return;

    setCancellingId(requestToCancel.id);

    try {
      await eventRequestsAPI.cancelRequest(requestToCancel.id);
      setShowCancelConfirm(false);
      setRequestToCancel(null);
      loadMyRequests();
    } catch (err) {
      alert('Fehler beim Stornieren der Anfrage');
    } finally {
      setCancellingId(null);
    }
  };

  const canCancelRequest = (request) => {
    return !['final_accepted', 'rejected', 'cancelled'].includes(request.request_stage);
  };

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'initial':
        return <Clock className="w-6 h-6 text-blue-500" />;
      case 'initial_accepted':
        return <Clock className="w-6 h-6 text-yellow-500 animate-pulse" />;
      case 'details_submitted':
        return <Clock className="w-6 h-6 text-purple-500" />;
      case 'final_accepted':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
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
      <div>
        <h3 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-2`}>
          Meine Event-Anfragen
        </h3>
        <p className={`text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
          Hier sehen Sie alle Ihre Event-Anfragen und deren Status
        </p>
      </div>

      {requests.length === 0 ? (
        <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-2xl shadow-xl p-12 text-center border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}>
          <Clock className={`w-16 h-16 text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mx-auto mb-4`} />
          <h3 className={`text-lg font-semibold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-2`}>
            Keine Anfragen vorhanden
          </h3>
          <p className={`text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
            Sie haben noch keine Event-Anfragen gestellt.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-2xl shadow-xl overflow-hidden border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    {getStageIcon(request.request_stage)}
                    <div>
                      <h4 className={`text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                        {request.event_name || request.title}
                      </h4>
                      <p className={`text-sm text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mt-1`}>
                        Eingereicht am:{' '}
                        {new Date(request.created_at).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {request.request_stage === 'initial_accepted' && (
                      <button
                        onClick={() => handleFillDetails(request)}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-lg animate-pulse"
                      >
                        Details ausfüllen →
                      </button>
                    )}
                    
                    {canCancelRequest(request) && (
                      <button
                        onClick={() => handleCancelRequest(request)}
                        disabled={cancellingId === request.id}
                        className={`px-6 py-3 border-2 border-red-500 ${isDarkMode ? 'dark:border-red-400' : ''} text-red-600 ${isDarkMode ? 'dark:text-red-400' : ''} rounded-lg hover:bg-red-50 ${isDarkMode ? 'dark:hover:bg-red-900/20' : ''} transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {cancellingId === request.id ? 'Wird storniert...' : 'Stornieren'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <RequestTimeline request={request} />

                {/* Status Messages */}
                {request.request_stage === 'initial' && (
                  <div className="mt-4 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-300 font-medium">
                      Ihre Anfrage wird von einem Administrator geprüft...
                    </p>
                  </div>
                )}

                {request.request_stage === 'initial_accepted' && (
                  <div className="mt-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-green-800 dark:text-green-300 font-medium mb-2">
                      Ihre Anfrage wurde akzeptiert!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Bitte füllen Sie nun die detaillierten Informationen aus und laden Sie den signierten Mietvertrag hoch.
                    </p>
                  </div>
                )}

                {request.request_stage === 'details_submitted' && (
                  <div className="mt-4 bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <p className="text-purple-800 dark:text-purple-300 font-medium mb-2">
                      Details eingereicht
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-400">
                      Ein Administrator überprüft Ihre Details und den Vertrag. Der Zeitraum ist vorübergehend im Kalender blockiert.
                    </p>
                  </div>
                )}

                {request.request_stage === 'final_accepted' && (
                  <div className="mt-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-green-800 dark:text-green-300 font-medium mb-2">
                      Event freigegeben!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Ihr Event wurde endgültig freigegeben und ist nun im Kalender sichtbar. Viel Erfolg!
                    </p>
                  </div>
                )}

                {request.request_stage === 'rejected' && request.rejection_reason && (
                  <div className="mt-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-300 font-medium mb-2">
                      Anfrage abgelehnt
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      Grund: {request.rejection_reason}
                    </p>
                  </div>
                )}

                {request.request_stage === 'cancelled' && (
                  <div className="mt-4 bg-gray-100 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-gray-800 dark:text-gray-300 font-medium">
                      Anfrage storniert
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && requestToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-2xl shadow-xl max-w-md w-full p-8 border-2 border-red-500 ${isDarkMode ? 'dark:border-red-400' : ''}`}>
            <h3 className={`text-2xl font-bold text-red-600 ${isDarkMode ? 'dark:text-red-400' : ''} mb-4`}>
              Anfrage stornieren?
            </h3>
            <p className={`text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} mb-6`}>
              Möchten Sie die Anfrage für "<strong>{requestToCancel.event_name || requestToCancel.title}</strong>" wirklich stornieren?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  setRequestToCancel(null);
                }}
                disabled={cancellingId === requestToCancel.id}
                className={`flex-1 px-6 py-3 border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} rounded-lg hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''} transition-colors font-semibold disabled:opacity-50`}
              >
                Abbrechen
              </button>
              <button
                onClick={confirmCancelRequest}
                disabled={cancellingId === requestToCancel.id}
                className={`flex-1 px-6 py-3 bg-red-600 ${isDarkMode ? 'dark:bg-red-700' : ''} text-white rounded-lg hover:bg-red-700 ${isDarkMode ? 'dark:hover:bg-red-800' : ''} transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {cancellingId === requestToCancel.id ? 'Wird storniert...' : 'Ja, stornieren'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Form Modal */}
      {showDetailedForm && selectedRequest && (
        <DetailedEventForm
          request={selectedRequest}
          isOpen={showDetailedForm}
          onClose={() => {
            setShowDetailedForm(false);
            setSelectedRequest(null);
          }}
          onSuccess={handleDetailsSubmitted}
        />
      )}
    </div>
  );
};

export default MyEventRequests;

