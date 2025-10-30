import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import { eventRequestsAPI } from '../services/httpApi';
import RequestTimeline from '../components/Calendar/RequestTimeline';
import DetailedEventForm from '../components/Calendar/DetailedEventForm';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useAuth } from '../contexts/AuthContext';

const EventRequestTrackingPage = () => {
  const { isDarkMode } = useDarkMode();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState(null);

  // Prefill email if logged in
  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user, email]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSearched(true);

    try {
      console.log('Searching for requests with email:', email);
      const data = await eventRequestsAPI.getByEmail(email);
      console.log('Search results:', data);
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError('Fehler beim Laden der Anfragen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailedForm(true);
  };

  const handleLoadMyRequests = async () => {
    if (!user?.id) return;
    setError('');
    setLoading(true);
    setSearched(true);
    try {
      const data = await eventRequestsAPI.getByUser(user.id);
      setRequests(data || []);
      // Do not overwrite the email input; keep what the user typed
    } catch (err) {
      setError('Fehler beim Laden Ihrer Anfragen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsSubmitted = () => {
    setShowDetailedForm(false);
    setSelectedRequest(null);
    // Refresh the list
    if (email) {
      handleSearch({ preventDefault: () => {} });
    }
  };

  const handleCancelRequest = (request) => {
    setRequestToCancel(request);
    setShowCancelConfirm(true);
  };

  const confirmCancelRequest = async () => {
    if (!requestToCancel) return;

    setCancellingId(requestToCancel.id);
    setError('');

    try {
      await eventRequestsAPI.cancelRequest(requestToCancel.id);
      setShowCancelConfirm(false);
      setRequestToCancel(null);
      // Refresh the list
      if (email) {
        handleSearch({ preventDefault: () => {} });
      }
    } catch (err) {
      console.error('Error cancelling request:', err);
      setError('Fehler beim Stornieren der Anfrage');
    } finally {
      setCancellingId(null);
    }
  };

  const canCancelRequest = (request) => {
    return !['final_accepted', 'rejected', 'cancelled'].includes(request.request_stage);
  };

  return (
    <Layout>
      <div className={`min-h-screen bg-[#F4F1E8] ${isDarkMode ? 'dark:bg-[#252422]' : ''} py-12 px-4`}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className={`text-4xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-4`}>
              Event-Anfrage verfolgen
            </h1>
            <p className={`text-lg text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
              Geben Sie Ihre E-Mail-Adresse ein, um den Status Ihrer Event-Anfragen zu sehen
            </p>
          </div>

          {/* Search Form */}
          <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-2xl shadow-xl p-6 mb-8 border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                  E-Mail-Adresse
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full px-3 py-3 border border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] ${isDarkMode ? 'dark:focus:ring-[#8a8a8a]' : ''} focus:ring-opacity-50 transition-colors bg-white ${isDarkMode ? 'dark:bg-[#1a1a1a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} placeholder-gray-500 ${isDarkMode ? 'dark:placeholder-gray-400' : ''}`}
                  placeholder="ihre@email.de"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-6 py-3 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} hover:bg-[#8a6a5a] ${isDarkMode ? 'dark:hover:bg-[#8a8a8a]' : ''}`}
                >
                  {loading ? 'Suche läuft...' : 'Anfragen suchen'}
                </button>
                {user?.id && (
                  <button
                    type="button"
                    onClick={handleLoadMyRequests}
                    disabled={loading}
                    className={`w-full px-6 py-3 text-sm font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''}`}
                  >
                    Meine Anfragen anzeigen
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`rounded-lg p-4 bg-red-50 ${isDarkMode ? 'dark:bg-red-900/20' : ''} border border-red-200 ${isDarkMode ? 'dark:border-red-800' : ''} mb-8`}>
              <p className={`text-sm text-red-600 ${isDarkMode ? 'dark:text-red-400' : ''}`}>{error}</p>
            </div>
          )}

          {/* Results */}
          {searched && !loading && (
            <div className="space-y-6">
              {requests.length === 0 ? (
                <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-2xl shadow-xl p-12 text-center border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}>
                  <h3 className={`text-xl font-semibold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-2`}>
                    Keine Anfragen gefunden
                  </h3>
                  <p className={`text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
                    Für diese E-Mail-Adresse gibt es keine Event-Anfragen.
                  </p>
                </div>
              ) : (
                <>
                  <div className={`bg-blue-50 ${isDarkMode ? 'dark:bg-blue-900/20' : ''} border border-blue-200 ${isDarkMode ? 'dark:border-blue-800' : ''} rounded-lg p-4`}>
                    <p className={`text-sm text-blue-800 ${isDarkMode ? 'dark:text-blue-300' : ''}`}>
                      {requests.length} Anfrage{requests.length !== 1 ? 'n' : ''} gefunden
                    </p>
                  </div>

                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-2xl shadow-xl overflow-hidden border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}
                    >
                      <div className={`p-6 border-b border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className={`text-2xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`}>
                              {request.event_name}
                            </h3>
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
                                {cancellingId === request.id ? 'Wird storniert...' : 'Anfrage stornieren'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <RequestTimeline request={request} />

                        {/* Show info message based on stage */}
                        {request.request_stage === 'initial_accepted' && (
                          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <p className="text-green-800 dark:text-green-300 font-medium mb-2">
                              Ihre Anfrage wurde akzeptiert!
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-400">
                              Bitte füllen Sie nun die detaillierten Informationen aus und laden Sie den signierten Mietvertrag hoch, damit Ihr Event endgültig freigegeben werden kann.
                            </p>
                          </div>
                        )}

                        {request.request_stage === 'details_submitted' && (
                          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-blue-800 dark:text-blue-300 font-medium mb-2">
                              Details eingereicht
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                              Ein Administrator überprüft gerade Ihre Details. Der gewünschte Zeitraum ist vorübergehend im Kalender als "Vorübergehend blockiert" markiert.
                            </p>
                          </div>
                        )}

                        {request.request_stage === 'final_accepted' && (
                          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <p className="text-green-800 dark:text-green-300 font-medium mb-2">
                              Event freigegeben!
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-400">
                              Ihr Event wurde endgültig freigegeben und ist nun im Kalender sichtbar. Viel Erfolg mit Ihrem Event!
                            </p>
                          </div>
                        )}

                        {request.request_stage === 'rejected' && request.rejection_reason && (
                          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-red-800 dark:text-red-300 font-medium mb-2">
                              Anfrage abgelehnt
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-400">
                              Grund: {request.rejection_reason}
                            </p>
                          </div>
                        )}

                        {request.request_stage === 'cancelled' && (
                          <div className="mt-6 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <p className="text-gray-800 dark:text-gray-300 font-medium mb-2">
                              Anfrage storniert
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-400">
                              Diese Anfrage wurde von Ihnen storniert.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Information Box */}
          <div className={`mt-12 bg-blue-50 ${isDarkMode ? 'dark:bg-blue-900/20' : ''} border-2 border-blue-200 ${isDarkMode ? 'dark:border-blue-800' : ''} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold text-blue-900 ${isDarkMode ? 'dark:text-blue-300' : ''} mb-3`}>
              Wie funktioniert der Prozess?
            </h3>
            <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Sie stellen eine initiale Event-Anfrage mit grundlegenden Informationen</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Ein Administrator prüft Ihre Anfrage und akzeptiert oder lehnt sie ab</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Bei Akzeptanz füllen Sie die detaillierten Informationen aus und laden den signierten Mietvertrag hoch</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Der Administrator gibt das Event endgültig frei und es erscheint im Kalender</span>
              </li>
            </ol>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-blue-700 dark:text-blue-400 italic">
                Während Schritte 2-3 ist Ihr gewünschter Zeitraum vorübergehend im Kalender blockiert.
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                Sie können Ihre Anfrage jederzeit stornieren, solange sie noch nicht endgültig freigegeben wurde.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && requestToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-2xl shadow-xl max-w-md w-full p-8 border-2 border-red-500 ${isDarkMode ? 'dark:border-red-400' : ''}`}>
            <h3 className={`text-2xl font-bold text-red-600 ${isDarkMode ? 'dark:text-red-400' : ''} mb-4`}>
              Anfrage stornieren?
            </h3>
            <p className={`text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} mb-6`}>
              Möchten Sie die Anfrage für "<strong>{requestToCancel.event_name}</strong>" wirklich stornieren?
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
    </Layout>
  );
};

export default EventRequestTrackingPage;

