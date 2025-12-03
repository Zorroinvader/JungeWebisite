// FILE OVERVIEW
// - Purpose: Page displaying Nikolausfeier form and list of submitted entries.
// - Used by: Route '/nikolausfeier' in App.js.
// - Notes: Production page. Shows form for submissions and displays all Nikolausfeier entries.

import React, { useEffect, useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import NikolausfeierForm from '../components/Nikolausfeier/NikolausfeierForm';
import { listNikolausfeierEntries, deleteNikolausfeierEntry, getPublicVideoUrl } from '../services/nikolausfeierApi';
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

  const loadEntries = async () => {
    try {
      const data = await listNikolausfeierEntries();
      setEntries(data);
      setError(null);
    } catch (err) {
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
        <h1 className="text-2xl sm:text-3xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-4 sm:mb-6">Nikolausfeier</h1>

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

        {/* Form Section */}
        <div className="mb-6 sm:mb-8">
          <NikolausfeierForm onSuccess={handleSuccess} />
        </div>

        {/* Entries List */}
        <div className="border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-xl p-4 sm:p-6 bg-white dark:bg-[#2a2a2a]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#252422] dark:text-[#F4F1E8]">Eingereichte Nikolausfeiern</h2>
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
              Noch keine Nikolausfeiern eingereicht.
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
                        className="w-full rounded-lg"
                        style={{ 
                          maxHeight: '250px',
                          aspectRatio: '16/9',
                          objectFit: 'contain'
                        }}
                        playsInline
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
      </div>
    </div>
  );
};

export default NikolausfeierPage;

