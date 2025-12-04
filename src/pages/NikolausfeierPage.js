// FILE OVERVIEW
// - Purpose: Page displaying Nikolausfeier form and list of submitted entries.
// - Used by: Route '/nikolausfeier' in App.js.
// - Notes: Production page. Shows form for submissions and displays all Nikolausfeier entries.

import React, { useEffect, useState } from 'react';
import { RefreshCw, Trash2, Plus, X, FileText, ExternalLink } from 'lucide-react';
import NikolausfeierForm from '../components/Nikolausfeier/NikolausfeierForm';
import { listNikolausfeierEntries, deleteNikolausfeierEntry, getPublicVideoUrl, checkIfAllVideosArePublic, getDeclinedEntryFromDevice } from '../services/nikolausfeierApi';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';

const NikolausfeierPage = () => {
  const { isAdmin } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [areAllVideosPublic, setAreAllVideosPublic] = useState(false);
  const [declinedEntry, setDeclinedEntry] = useState(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await listNikolausfeierEntries();
      
      // Debug: Check localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const stored = window.localStorage.getItem('nikolausfeier_device_entries');
          if (stored) {
            const deviceIds = JSON.parse(stored);
            console.log('Device entry IDs in localStorage:', deviceIds);
            console.log('Loaded entries:', data.map(e => ({ id: e.id, video_name: e.video_name })));
          }
        } catch (e) {
          console.warn('Could not read localStorage:', e);
        }
      }
      
      setEntries(data);
      setError(null);
      
      // Check if all videos are publicly published (check all approved entries in DB, not just visible ones)
      try {
        const allPublic = await checkIfAllVideosArePublic();
        setAreAllVideosPublic(allPublic);
        
        // If user has approved entries, collapse the form by default
        if (data && data.length > 0) {
          setIsFormCollapsed(true);
        }
      } catch (err) {
        console.warn('Could not check if all videos are public:', err);
        setAreAllVideosPublic(false);
      }
      
      // Check for declined entries from this device
      try {
        const declined = await getDeclinedEntryFromDevice();
        if (declined) {
          console.log('Found declined entry from device:', declined);
          setDeclinedEntry(declined);
          // Show notification about declined entry
          setNotification({ 
            type: 'error', 
            text: `Dein Beitrag "${declined.video_name}" wurde abgelehnt. Du kannst einen neuen Beitrag einreichen.` 
          });
        } else {
          setDeclinedEntry(null);
        }
      } catch (err) {
        console.warn('Could not check for declined entries:', err);
        setDeclinedEntry(null);
      }
    } catch (err) {
      console.error('Error loading entries:', err);
      setError(err.message || 'Fehler beim Laden der Einträge');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleSuccess = () => {
    loadEntries();
    setNotification({ type: 'success', text: 'Nikolausfeier erfolgreich eingereicht!' });
    setTimeout(() => setNotification(null), 3000);
    // Collapse form after successful submission
    setIsFormCollapsed(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Möchten Sie diesen Eintrag wirklich löschen? Das Video wird ebenfalls gelöscht.')) {
      return;
    }
    try {
      await deleteNikolausfeierEntry(id);
      setEntries(entries.filter(e => e.id !== id));
      setNotification({ type: 'success', text: 'Eintrag erfolgreich gelöscht' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Fehler beim Löschen' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds} Sekunden`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes} Min ${secs} Sek` : `${minutes} Minuten`;
  };

  return (
    <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422]">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#252422] dark:text-[#F4F1E8]">Nikolausfeier / Bier Wettbewerb</h1>
          <button
            onClick={() => setShowRulesModal(true)}
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 text-sm sm:text-base font-semibold rounded-lg border-2 border-[#A58C81] dark:border-[#EBE9E9] text-[#252422] dark:text-[#F4F1E8] hover:bg-[#A58C81] hover:text-white dark:hover:bg-[#A58C81] dark:hover:text-white transition-colors shadow-md"
          >
            <FileText className="h-5 w-5" />
            Regeln anzeigen
          </button>
        </div>

        {notification && (
          <div className={`mb-4 p-3 rounded-lg border ${
            notification.type === 'success' 
              ? 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm">{notification.text}</span>
              <button onClick={() => setNotification(null)} className="text-xs underline">Schließen</button>
            </div>
          </div>
        )}

        {/* Form Section - Collapsible */}
        <div className="mb-6 sm:mb-8">
          {isFormCollapsed ? (
            <div className="border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-xl p-4 sm:p-6 bg-white dark:bg-[#2a2a2a]">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-[#252422] dark:text-[#F4F1E8] mb-2">
                    Neuen Beitrag einreichen
                  </h2>
                  <p className="text-sm text-[#A58C81] dark:text-[#EBE9E9]">
                    Du kannst jederzeit einen weitere Beitrag für den Bier Wettbewerb einreichen.
                    Ob einen aktualisierten Beitrag für dich oder einen neuen/aktuelleren Beitrag für deine Freunde.
                  </p>
                </div>
                <button
                  onClick={() => setIsFormCollapsed(false)}
                  className="w-full sm:w-auto min-h-[44px] px-4 sm:px-6 py-2.5 bg-[#6054d9] hover:bg-[#4f44c7] text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-md flex-shrink-0"
                >
                  <Plus className="h-5 w-5" />
                  <span className="hidden sm:inline">Beitrag hinzufügen</span>
                  <span className="sm:hidden">Hinzufügen</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-xl p-4 sm:p-6 bg-white dark:bg-[#2a2a2a]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-[#252422] dark:text-[#F4F1E8]">
                  Neuen Beitrag einreichen
                </h2>
                {entries.length > 0 && (
                  <button
                    onClick={() => setIsFormCollapsed(true)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#A58C81] dark:text-[#EBE9E9] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-lg transition-colors"
                    title="Formular minimieren"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <NikolausfeierForm onSuccess={handleSuccess} />
            </div>
          )}
        </div>

        {/* Entries List */}
        <div className="border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-xl p-4 sm:p-6 bg-white dark:bg-[#2a2a2a]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-2">
                {areAllVideosPublic ? 'Eingereichte Teilnahmen' : 'Deine Beiträge'}
              </h2>
              {areAllVideosPublic ? (
                <p className="text-sm text-[#A58C81] dark:text-[#EBE9E9]">
                  Alle Videos wurden veröffentlicht! Hier sind alle Teilnahmen des Bier Wettbewerbs.
                </p>
              ) : (
                <p className="text-sm text-[#A58C81] dark:text-[#EBE9E9]">
                  Die restlichen Videos der anderen Teilnehmer seht ihr am Ende des Events, also strengt euch an!
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setRefreshing(true);
                loadEntries();
              }}
              disabled={refreshing}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md border-2 border-[#A58C81] text-[#252422] dark:text-[#F4F1E8] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 touch-manipulation"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Aktualisieren
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-[#A58C81] dark:text-[#EBE9E9] mx-auto mb-4" />
              <p className="text-[#252422] dark:text-[#F4F1E8]">Laden...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-[#A58C81] dark:text-[#EBE9E9]">
              <p className="mb-2">Noch keine Teilnahmen eingereicht.</p>
              <p className="text-sm opacity-75">
                Deine freigegebenen Beiträge werden hier angezeigt, sobald sie von einem Admin genehmigt wurden.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {entries.map(entry => (
                <div
                  key={entry.id}
                  className="border-2 border-[#A58C81]/30 dark:border-[#EBE9E9]/30 rounded-xl overflow-hidden bg-white dark:bg-[#1a1a1a]"
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-[#252422] dark:text-[#F4F1E8] mb-1 break-words">
                          {entry.video_name || entry.event_name}
                        </h3>
                        {entry.participant_name && (
                          <p className="text-xs sm:text-sm text-[#A58C81] dark:text-[#EBE9E9] break-words">
                            von {entry.participant_name}
                          </p>
                        )}
                      </div>
                      {isAdmin() && (
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors touch-manipulation"
                          title="Löschen"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="mb-3 sm:mb-4 w-full">
                      <video
                        src={getPublicVideoUrl(entry.video_url)}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full rounded-lg touch-manipulation"
                        style={{ 
                          maxHeight: '250px',
                          aspectRatio: '16/9',
                          objectFit: 'contain',
                          backgroundColor: '#000',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          // Explicitly handle tap on iOS
                          const video = e.target;
                          if (video.paused) {
                            video.play().catch(err => {
                              console.error('Video play error:', err);
                            });
                          } else {
                            video.pause();
                          }
                        }}
                        onError={(e) => {
                          console.error('Video load error:', e);
                          console.error('Video URL:', getPublicVideoUrl(entry.video_url));
                          console.error('Video element:', e.target);
                        }}
                        onLoadedMetadata={(e) => {
                          // Ensure video is ready on iOS
                          console.log('Video metadata loaded for:', entry.video_name);
                        }}
                      >
                        Ihr Browser unterstützt das Video-Element nicht.
                      </video>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                      <div className="flex flex-wrap items-center gap-2 text-[#A58C81] dark:text-[#EBE9E9]">
                        <span className="font-semibold">Bier-Trinkzeit:</span>
                        <span>{formatTime(entry.beer_drink_time)}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Eingereicht: {new Date(entry.created_at).toLocaleString('de-DE')}
                      </div>
                      {entry.dsgvo_consent && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          ✓ DSGVO-Einwilligung erteilt
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rules Modal */}
        {showRulesModal && (
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowRulesModal(false)}
          >
            <div 
              className="bg-white dark:bg-[#2a2a2a] rounded-xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-[#A58C81] dark:border-[#EBE9E9]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-[#2a2a2a] border-b-2 border-[#A58C81] dark:border-[#EBE9E9] p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#252422] dark:text-[#F4F1E8]">
                    Bier Wettbewerb - Regeln & Informationen
                  </h2>
                  <button
                    onClick={() => setShowRulesModal(false)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#A58C81] dark:text-[#EBE9E9] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-lg transition-colors"
                    title="Schließen"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-6">
                {/* Important Rules */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-lg p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    ⚠️ Wichtige Regel
                  </h3>
                  <p className="text-sm sm:text-base text-orange-800 dark:text-orange-200">
                    <strong>Es darf kein Restbier mehr in der Flasche sein!</strong> Am Ende des Videos am besten die Flasche umdrehen, um zu zeigen, dass sie leer ist.
                  </p>
                </div>

                {/* General Information */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    ℹ️ Informationen zum Bier Wettbewerb
                  </h3>
                  <ul className="text-sm sm:text-base text-blue-800 dark:text-blue-200 space-y-2 list-disc list-inside">
                    <li>Zeige uns wie schnell du ein Bier trinken kannst.</li>
                    <li>Du kannst mehrere Beiträge für den Bier Wettbewerb einreichen.</li>
                    <li>Du hast eine bessere Zeit als dein letzter Beitrag? Dann kannst du ihn aktualisieren.</li>
                    <li>Du kannst Beiträge für dich oder deine Freunde erstellen.</li>
                  </ul>
                </div>

                {/* Step-by-Step Requirements */}
                <div className="border-2 border-[#A58C81]/30 dark:border-[#EBE9E9]/30 rounded-lg p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-[#252422] dark:text-[#F4F1E8] mb-3">
                    📋 Was du für deinen Beitrag brauchst:
                  </h3>
                  <ol className="text-sm sm:text-base text-[#252422] dark:text-[#F4F1E8] space-y-2 list-decimal list-inside">
                    <li><strong>Name des Videos/Clips:</strong> Gib deinem Beitrag einen Namen (max. 200 Zeichen)</li>
                    <li><strong>Dein Name:</strong> Name für die Ankündigung (max. 100 Zeichen)</li>
                    <li><strong>Video:</strong> Zeige wie du dein Bier trinkst! Die Zeit muss nachzählbar sein!</li>
                    <li><strong>Bier-Trinkzeit:</strong> Gib die Zeit in Sekunden an, die du zum Trinken benötigt hast</li>
                    <li><strong>Trinkregeln:</strong> Du musst die Trinkregeln akzeptieren</li>
                    <li><strong>Zeitverifikation:</strong> Die Bier-Trinkzeit muss im Video nachvollziehbar sein, die Zeit muss nachzählbar sein und mit der angegeben Zeit im Beitrag übereinstimmen</li>
                    <li><strong>Datenschutz:</strong> Du musst der DSGVO-Einwilligung zustimmen</li>
                  </ol>
                </div>

                {/* PDF Link */}
                <div className="bg-[#F4F1E8] dark:bg-[#1a1a1a] border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-lg p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-[#252422] dark:text-[#F4F1E8] mb-3">
                    📄 Vollständige Wettbewerbsrichtlinien
                  </h3>
                  <p className="text-sm sm:text-base text-[#252422] dark:text-[#F4F1E8] mb-4">
                    Für weitere Wettbewerbsrichtlinien und Regeln, bitte das PDF-Dokument lesen Diese dienen eurem und unserem Schutz:
                  </p>
                  <a
                    href="/wettbewerbsrichtlinien-bier-wettbewerb.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-[#6054d9] hover:bg-[#4f44c7] text-white rounded-lg font-semibold transition-colors shadow-md"
                  >
                    <FileText className="h-5 w-5" />
                    Wettbewerbsrichtlinien öffnen
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                {/* Help */}
                <div className="text-center pt-2">
                  <p className="text-sm text-[#A58C81] dark:text-[#EBE9E9]">
                    Fragen? Komme zur Bar, wir helfen dir gerne weiter.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-[#2a2a2a] border-t-2 border-[#A58C81] dark:border-[#EBE9E9] p-4 sm:p-6">
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="w-full min-h-[44px] px-6 py-3 bg-[#A58C81] hover:bg-[#8a7268] text-white rounded-lg font-semibold transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NikolausfeierPage;

