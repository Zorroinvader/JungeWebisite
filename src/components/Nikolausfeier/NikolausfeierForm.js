// FILE OVERVIEW
// - Purpose: Form component for submitting Nikolausfeier entries with event name, video upload, beer drink time, and DSGVO consent.
// - Used by: NikolausfeierPage for user submissions.
// - Notes: Production component. Handles video file uploads and form validation. Mobile-first design.

import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, X, Video, Trash2, Plus, ChevronLeft, ChevronRight, Camera, FileText } from 'lucide-react';
import { createNikolausfeierEntry, getEntriesByIds, deleteNikolausfeierEntry } from '../../services/nikolausfeierApi';
import { useDarkMode } from '../../contexts/DarkModeContext';

const STORAGE_FORM_KEY = 'nikolausfeier_form_data';
const STORAGE_DEVICE_ENTRIES_KEY = 'nikolausfeier_device_entries'; // Store entry IDs created from this device

const NikolausfeierForm = ({ onSuccess }) => {
  const { isDarkMode } = useDarkMode();
  
  const [formData, setFormData] = useState({
    video_name: '',
    participant_name: '',
    beer_drink_time: '',
    dsgvo_consent: false,
    drinking_rules_consent: false
  });
  
  const [videoFile, setVideoFile] = useState(null);
  const [deleteOldEntryId, setDeleteOldEntryId] = useState('');
  const [wantToUpdateOldEntry, setWantToUpdateOldEntry] = useState(false);
  const [userPreviousEntries, setUserPreviousEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasDeviceEntries, setHasDeviceEntries] = useState(false);
  const [showFormOnMobile, setShowFormOnMobile] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(7);

  // Check if device has entries and detect mobile
  useEffect(() => {
    const checkDeviceEntries = () => {
      try {
        const storedEntryIds = localStorage.getItem(STORAGE_DEVICE_ENTRIES_KEY);
        const hasEntries = storedEntryIds && JSON.parse(storedEntryIds).length > 0;
        setHasDeviceEntries(hasEntries);
        
        // On mobile, hide form if entries exist
        const checkMobile = () => {
          const mobile = window.innerWidth < 768; // md breakpoint
          setIsMobile(mobile);
          if (mobile && hasEntries) {
            setShowFormOnMobile(false);
            // If has entries, step 1 is the update option, otherwise start at step 1
            setTotalSteps(hasEntries ? 7 : 6);
            setCurrentStep(hasEntries ? 1 : 1);
          } else {
            setShowFormOnMobile(true);
            setTotalSteps(hasEntries ? 7 : 6);
            setCurrentStep(1);
          }
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
      } catch (e) {
        // Ignore storage errors
      }
    };
    
    checkDeviceEntries();
  }, []);

  // Load form data on mount
  useEffect(() => {
    try {
      const storedForm = localStorage.getItem(STORAGE_FORM_KEY);
      
      if (storedForm) {
        const formDataStored = JSON.parse(storedForm);
        setFormData(prev => ({
          ...prev,
          ...formDataStored,
          dsgvo_consent: false // Always reset consent
        }));
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
    
    // No longer need to load entries based on participant name
  };

  const loadDeviceEntries = async () => {
    setLoadingEntries(true);
    try {
      // Get entry IDs stored in localStorage for this device
      const storedEntryIds = localStorage.getItem(STORAGE_DEVICE_ENTRIES_KEY);
      if (!storedEntryIds) {
        setUserPreviousEntries([]);
        setDeleteOldEntryId('');
        return;
      }

      const entryIds = JSON.parse(storedEntryIds);
      if (!Array.isArray(entryIds) || entryIds.length === 0) {
        setUserPreviousEntries([]);
        setDeleteOldEntryId('');
        return;
      }

      // Fetch entries by IDs
      const entries = await getEntriesByIds(entryIds);
      setUserPreviousEntries(entries);
      setDeleteOldEntryId(''); // Reset selection
      
      // Clean up localStorage: remove IDs that no longer exist (e.g., deleted entries)
      const foundIds = entries.map(e => e.id);
      const validIds = entryIds.filter(id => foundIds.includes(id));
      if (validIds.length !== entryIds.length) {
        // Some IDs were removed, update localStorage
        if (validIds.length > 0) {
          localStorage.setItem(STORAGE_DEVICE_ENTRIES_KEY, JSON.stringify(validIds));
        } else {
          localStorage.removeItem(STORAGE_DEVICE_ENTRIES_KEY);
        }
      }
    } catch (err) {
      console.warn('Could not load device entries:', err);
      setUserPreviousEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
      const maxFileSize = 100 * 1024 * 1024; // 100MB
      
      if (!allowedVideoTypes.includes(file.type)) {
        setError('Nur Video-Dateien sind erlaubt (MP4, MOV, AVI, WEBM)');
        return;
      }
      if (file.size > maxFileSize) {
        setError('Die Video-Datei ist zu groß (max. 100MB)');
        return;
      }
      
      setVideoFile(file);
      if (error) setError('');
      
      // On mobile, auto-advance to next step after video selection
      if (isMobile) {
        const videoStep = hasDeviceEntries ? 4 : 3;
        if (currentStep === videoStep) {
          setTimeout(() => {
            setCurrentStep(videoStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 500);
        }
      }
    }
  };

  const handleUpdateOldEntryChange = (checked) => {
    setWantToUpdateOldEntry(checked);
    if (checked) {
      loadDeviceEntries();
    } else {
      setDeleteOldEntryId('');
      setUserPreviousEntries([]);
      // Don't auto-advance when unchecking - let user manually proceed
    }
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      // Scroll to top of form on mobile
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Scroll to top of form on mobile
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const canProceedToNextStep = () => {
    // Map currentStep to actual form step based on whether device has entries
    if (hasDeviceEntries) {
      // Steps: 1=update, 2=video name, 3=participant, 4=video, 5=beer, 6=drinking rules, 7=dsgvo
      switch (currentStep) {
        case 1: // Update old entry step
          return wantToUpdateOldEntry === false || (wantToUpdateOldEntry && deleteOldEntryId);
        case 2: // Video name
          return formData.video_name.trim().length > 0 && formData.video_name.trim().length <= 200;
        case 3: // Participant name
          return formData.participant_name.trim().length > 0 && formData.participant_name.trim().length <= 100;
        case 4: // Video upload
          return videoFile !== null;
        case 5: // Beer drink time
          return formData.beer_drink_time && parseInt(formData.beer_drink_time, 10) >= 0;
        case 6: // Drinking rules consent
          return formData.drinking_rules_consent;
        case 7: // DSGVO consent
          return formData.dsgvo_consent;
        default:
          return false;
      }
    } else {
      // Steps: 1=video name, 2=participant, 3=video, 4=beer, 5=drinking rules, 6=dsgvo
      switch (currentStep) {
        case 1: // Video name
          return formData.video_name.trim().length > 0 && formData.video_name.trim().length <= 200;
        case 2: // Participant name
          return formData.participant_name.trim().length > 0 && formData.participant_name.trim().length <= 100;
        case 3: // Video upload
          return videoFile !== null;
        case 4: // Beer drink time
          return formData.beer_drink_time && parseInt(formData.beer_drink_time, 10) >= 0;
        case 5: // Drinking rules consent
          return formData.drinking_rules_consent;
        case 6: // DSGVO consent
          return formData.dsgvo_consent;
        default:
          return false;
      }
    }
  };

  const validateForm = () => {
    if (!formData.video_name.trim()) {
      setError('Bitte geben Sie einen Namen für das Video/Clip ein');
      return false;
    }
    if (formData.video_name.trim().length > 200) {
      setError('Der Video-Name darf maximal 200 Zeichen lang sein');
      return false;
    }
    if (!formData.participant_name.trim()) {
      setError('Bitte geben Sie Ihren Namen ein');
      return false;
    }
    if (formData.participant_name.trim().length > 100) {
      setError('Der Name darf maximal 100 Zeichen lang sein');
      return false;
    }
    if (!videoFile) {
      setError('Bitte laden Sie ein Video hoch');
      return false;
    }
    if (wantToUpdateOldEntry && !deleteOldEntryId) {
      setError('Bitte wählen Sie den alten Beitrag aus, den Sie ersetzen möchten');
      return false;
    }
    if (!formData.beer_drink_time || formData.beer_drink_time < 0) {
      setError('Bitte geben Sie eine gültige Bier-Trinkzeit ein (in Sekunden)');
      return false;
    }
    if (!formData.drinking_rules_consent) {
      setError('Bitte akzeptieren Sie die Trinkregeln');
      return false;
    }
    if (!formData.dsgvo_consent) {
      setError('Bitte bestätigen Sie die DSGVO-Einwilligung');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setUploadProgress(10);

    try {
      setUploadProgress(30);
      
      const newEntry = await createNikolausfeierEntry({
        video_name: formData.video_name.trim(),
        participant_name: formData.participant_name.trim(),
        videoFile: videoFile,
        beer_drink_time: parseInt(formData.beer_drink_time, 10),
        dsgvo_consent: formData.dsgvo_consent,
        drinking_rules_consent: formData.drinking_rules_consent,
        competition_rules_consent: formData.competition_rules_consent,
        replaces_entry_id: deleteOldEntryId || null
      });
      
      setUploadProgress(100);
      setSuccess(true);
      
      // Store form data (except consent) for convenience when creating new entries
      localStorage.setItem(STORAGE_FORM_KEY, JSON.stringify({
        participant_name: formData.participant_name.trim()
      }));
      
      // Store new entry ID in device storage
      try {
        const storedEntryIds = localStorage.getItem(STORAGE_DEVICE_ENTRIES_KEY);
        const entryIds = storedEntryIds ? JSON.parse(storedEntryIds) : [];
        if (newEntry && newEntry.id) {
          entryIds.push(newEntry.id);
          localStorage.setItem(STORAGE_DEVICE_ENTRIES_KEY, JSON.stringify(entryIds));
          setHasDeviceEntries(true);
        }
      } catch (err) {
        console.warn('Could not store entry ID in device storage:', err);
      }
      
      // On mobile, hide form after successful submission
      if (isMobile) {
        setShowFormOnMobile(false);
      }
      
      // Note: Old entry will be deleted automatically when the new entry is approved by admin
      // Remove old entry ID from device storage if it was marked for replacement
      if (deleteOldEntryId) {
        try {
          const storedEntryIds = localStorage.getItem(STORAGE_DEVICE_ENTRIES_KEY);
          if (storedEntryIds) {
            const entryIds = JSON.parse(storedEntryIds);
            const filteredIds = entryIds.filter(id => id !== deleteOldEntryId);
            localStorage.setItem(STORAGE_DEVICE_ENTRIES_KEY, JSON.stringify(filteredIds));
          }
        } catch (err) {
          console.warn('Could not update device storage:', err);
        }
      }
      
      // Reset form for new entry
      setFormData({
        video_name: '',
        participant_name: '',
        beer_drink_time: '',
        dsgvo_consent: false,
        drinking_rules_consent: false
      });
      setVideoFile(null);
      setDeleteOldEntryId('');
      setWantToUpdateOldEntry(false);
      setUserPreviousEntries([]);
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern des Bier Wettbewerb Beitrags');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className={`border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-xl p-4 sm:p-6 bg-white dark:bg-[#2a2a2a]`}>
      {/* Mobile: Show button to reveal form if entries exist and form is hidden */}
      {isMobile && hasDeviceEntries && !showFormOnMobile ? (
        <div className="text-center py-6 sm:py-4">
          <div className="mb-4">
            <CheckCircle className="h-12 w-12 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <h2 className="text-lg sm:text-xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-2">
              Beitrag bereits eingereicht
            </h2>
            <p className="text-sm text-[#A58C81] dark:text-[#EBE9E9] mb-3">
              Du hast bereits einen Beitrag von diesem Gerät für den <strong>Bier Wettbewerb</strong> eingereicht.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4 text-left">
              <p className="text-xs text-blue-900 dark:text-blue-100 mb-2">
                <strong>💡 Hinweis:</strong> Du kannst mehrere Beiträge für den Bier Wettbewerb einreichen!
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Erstelle weitere Beiträge für dich oder deine Freunde. Jeder Beitrag ist eine separate Teilnahme am <strong>Bier Wettbewerb</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowFormOnMobile(true)}
            className="w-full min-h-[48px] px-6 py-3 rounded-lg font-semibold transition-colors text-base touch-manipulation bg-[#A58C81] hover:bg-[#8a7268] active:bg-[#7a6258] text-white shadow-md flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Neuen Beitrag für den Bier Wettbewerb erstellen
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-xl sm:text-2xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-2 sm:mb-4">
            Bier Wettbewerb - Beitrag einreichen
          </h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100 mb-2">
              <strong>ℹ️ Informationen zum Bier Wettbewerb:</strong>
            </p>
            <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Zeige uns wie schnell du ein Bier Trinken kannst.</li>
              <li>Du kannst mehrere Beiträge für den Bier Wettbewerb einreichen.</li>
              <li>Du hast eine bessere Zeit als dein letzter Beitrag? Dann kannst du ihn aktualisieren.</li>
              <li>Du kannst Beiträge für dich oder deine Freunde erstellen.</li>
              <li>Preis? Mindestens noch mehr Bier (Oder Cola und so ein kram)!</li>
              <li>Erst bei der Preisvergaben werden die Zeiten veröffentlicht. Also gib dein Bestes!</li>
              <li> Wir behalten uns vor, dir das Bier zu nehmen, wenn du deine grenzen überschreitest!</li>
            </ul>
          </div>
          <p className="text-xs sm:text-sm text-[#A58C81] dark:text-[#EBE9E9] mb-4 sm:mb-6">
           Fragen? Komme zur Bar, wie helfen dir gerne weiter.
          </p>
          
          {success && (
        <div className="mb-4 p-4 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300">
          <div className="flex items-start gap-2 mb-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm sm:text-base">Beitrag für Bier Wettbewerb erfolgreich eingereicht!</p>
              <p className="text-xs sm:text-sm mt-2">
                Dein Video wurde hochgeladen und wartet auf Freigabe durch einen Administrator. 
                Die Freigabe erfolgt in der Regel innerhalb der nächsten 5 Minuten.
              </p>
              <div className="mt-3 pt-3 border-t border-green-300 dark:border-green-600">
                <p className="text-xs text-green-800 dark:text-green-200">
                  💡 <strong>Tipp:</strong> Du kannst weitere Beiträge für den Bier Wettbewerb einreichen! 
                  Erstelle einfach einen neuen Beitrag für dich oder deine Freunde.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
          <p className="text-sm sm:text-base break-words">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Progress Indicator - Mobile Only */}
        {isMobile && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#A58C81] dark:text-[#EBE9E9]">
                Schritt {currentStep} von {totalSteps}
              </span>
              <span className="text-xs text-[#A58C81] dark:text-[#EBE9E9]">
                {Math.round((currentStep / totalSteps) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-[#A58C81] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Update Old Entry (only if hasDeviceEntries) */}
        {((isMobile && currentStep === 1 && hasDeviceEntries) || (!isMobile && hasDeviceEntries)) && (
          <div className={`${isMobile ? '' : 'mb-6'} p-4 sm:p-4 bg-gray-50 dark:bg-gray-900/20 border-2 border-gray-200 dark:border-gray-700 rounded-lg`}>
            <h3 className="text-base sm:text-lg font-semibold text-[#252422] dark:text-[#F4F1E8] mb-4">
               1. Alten Bier Wettbewerb Beitrag aktualisieren?
            </h3>
            <label className="flex items-start gap-3 cursor-pointer touch-manipulation min-h-[52px] sm:min-h-[44px] py-1 mb-4">
              <input
                type="checkbox"
                checked={wantToUpdateOldEntry}
                onChange={(e) => handleUpdateOldEntryChange(e.target.checked)}
                className="mt-1.5 h-6 w-6 sm:h-5 sm:w-5 text-[#A58C81] border-[#A58C81] rounded focus:ring-[#A58C81] touch-manipulation"
              />
              <span className="text-sm sm:text-base text-[#252422] dark:text-[#F4F1E8] flex-1 pt-1">
                Ich möchte einen alten Beitrag aktualisieren
              </span>
            </label>
            
            {wantToUpdateOldEntry && (
              <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                {loadingEntries ? (
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center py-2">
                    Lade deine Beiträge...
                  </div>
                ) : userPreviousEntries.length > 0 ? (
                  <>
                    <label htmlFor="old_entry_select" className="block text-xs sm:text-sm font-semibold text-[#252422] dark:text-[#F4F1E8] mb-2">
                      Welchen alten Beitrag möchtest du ersetzen? <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="old_entry_select"
                      value={deleteOldEntryId}
                      onChange={(e) => {
                        setDeleteOldEntryId(e.target.value);
                      }}
                      required={wantToUpdateOldEntry}
                      className="w-full min-h-[48px] sm:min-h-[44px] px-4 py-3 sm:py-2 text-base sm:text-sm border-2 border-[#A58C81]/40 dark:border-[#EBE9E9]/40 rounded-lg bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#F4F1E8] touch-manipulation"
                    >
                      <option value="">— Bitte wählen —</option>
                      {userPreviousEntries.map(entry => (
                        <option key={entry.id} value={entry.id}>
                          {entry.video_name || 'Unbenannt'} ({new Date(entry.created_at).toLocaleDateString('de-DE')}) - {entry.status === 'pending' ? 'Wartend' : 'Freigegeben'}
                        </option>
                      ))}
                    </select>
                    {deleteOldEntryId && (
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                        Der ausgewählte alte Beitrag wird gelöscht, wenn dieser neue Beitrag erfolgreich hochgeladen wurde.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Keine vorherigen Beiträge von diesem Gerät gefunden.
                  </p>
                )}
              </div>
            )}
            
            {isMobile && (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={wantToUpdateOldEntry && !deleteOldEntryId}
                className={`w-full min-h-[52px] mt-4 px-6 py-3 rounded-lg font-semibold transition-colors text-base touch-manipulation flex items-center justify-center gap-2 ${
                  wantToUpdateOldEntry && !deleteOldEntryId
                    ? 'bg-gray-400 cursor-not-allowed opacity-60 text-white'
                    : 'bg-[#A58C81] hover:bg-[#8a7268] active:bg-[#7a6258] text-white shadow-md'
                }`}
              >
                Weiter <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Step 2: Video Name */}
        {((isMobile && currentStep === (hasDeviceEntries ? 2 : 1)) || !isMobile) && (
          <div className={`${isMobile ? '' : 'mb-6'}`}>
            <h3 className="text-base sm:text-lg font-semibold text-[#252422] dark:text-[#F4F1E8] mb-4">
            2. Name des Videos/Clips
            </h3>
            <label htmlFor="video_name" className="block text-sm sm:text-base font-semibold text-[#252422] dark:text-[#F4F1E8] mb-2">
              Name des Videos/Clips <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="video_name"
              name="video_name"
              value={formData.video_name}
              onChange={handleChange}
              maxLength={200}
              required
              className="w-full px-4 py-3.5 sm:py-2.5 text-base sm:text-sm border-2 border-[#A58C81]/40 dark:border-[#EBE9E9]/40 focus:border-[#A58C81] dark:focus:border-[#EBE9E9] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#F4F1E8] touch-manipulation"
              placeholder="z.B. BierMeister MAX"
            />
            {isMobile && (
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex-1 min-h-[52px] px-4 py-3 rounded-lg font-semibold transition-colors text-base touch-manipulation bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-[#252422] dark:text-[#F4F1E8] flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-5 w-5" /> Zurück
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!formData.video_name.trim()}
                  className={`flex-1 min-h-[52px] px-4 py-3 rounded-lg font-semibold transition-colors text-base touch-manipulation flex items-center justify-center gap-2 ${
                    !formData.video_name.trim()
                      ? 'bg-gray-400 cursor-not-allowed opacity-60 text-white'
                      : 'bg-[#A58C81] hover:bg-[#8a7268] active:bg-[#7a6258] text-white shadow-md'
                  }`}
                >
                  Weiter <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Participant Name */}
        {((isMobile && currentStep === (hasDeviceEntries ? 3 : 2)) || !isMobile) && (
          <div className={`${isMobile ? '' : 'mb-6'}`}>
            <h3 className="text-base sm:text-lg font-semibold text-[#252422] dark:text-[#F4F1E8] mb-4">
            3. Name für die Ankündigung
            </h3>
            <label htmlFor="participant_name" className="block text-sm sm:text-base font-semibold text-[#252422] dark:text-[#F4F1E8] mb-2">
              Dein Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="participant_name"
              name="participant_name"
              value={formData.participant_name}
              onChange={handleChange}
              maxLength={100}
              required
              className="w-full px-4 py-3.5 sm:py-2.5 text-base sm:text-sm border-2 border-[#A58C81]/40 dark:border-[#EBE9E9]/40 focus:border-[#A58C81] dark:focus:border-[#EBE9E9] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#F4F1E8] touch-manipulation"
              placeholder="z.B. Max Mustermann"
            />
            {isMobile && (
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex-1 min-h-[52px] px-4 py-3 rounded-lg font-semibold transition-colors text-base touch-manipulation bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-[#252422] dark:text-[#F4F1E8] flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-5 w-5" /> Zurück
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!formData.participant_name.trim()}
                  className={`flex-1 min-h-[52px] px-4 py-3 rounded-lg font-semibold transition-colors text-base touch-manipulation flex items-center justify-center gap-2 ${
                    !formData.participant_name.trim()
                      ? 'bg-gray-400 cursor-not-allowed opacity-60 text-white'
                      : 'bg-[#A58C81] hover:bg-[#8a7268] active:bg-[#7a6258] text-white shadow-md'
                  }`}
                >
                  Weiter <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Video Upload */}
        {((isMobile && currentStep === (hasDeviceEntries ? 4 : 3)) || !isMobile) && (
          <div className={`${isMobile ? '' : 'mb-6'}`}>
            <h3 className="text-base sm:text-lg font-semibold text-[#252422] dark:text-[#F4F1E8] mb-4">
            4. Video hochladen (Es muss zeigen wie du dein Bier getrunken hast! Die Zeit muss nachzählbar sein!)
            </h3>
            <label htmlFor="video" className="block text-sm sm:text-base font-semibold text-[#252422] dark:text-[#F4F1E8] mb-2">
              Video <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <input
                type="file"
                id="video"
                name="video"
                accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm"
                capture="environment"
                onChange={handleFileChange}
                required
                className="hidden"
              />
              <label
                htmlFor="video"
                className={`flex flex-col items-center justify-center gap-3 px-4 py-6 sm:py-4 min-h-[120px] sm:min-h-[100px] border-2 border-dashed border-[#A58C81]/40 dark:border-[#EBE9E9]/40 rounded-lg cursor-pointer hover:border-[#A58C81] dark:hover:border-[#EBE9E9] active:border-[#8a7268] dark:active:border-[#d4d2c7] transition-colors bg-white dark:bg-[#1a1a1a] touch-manipulation`}
              >
                {videoFile ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[#252422] dark:text-[#F4F1E8]">{videoFile.name}</p>
                      <p className="text-xs text-[#A58C81] dark:text-[#EBE9E9] mt-1">
                        {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoFile(null);
                        document.getElementById('video').value = '';
                      }}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      Anderes Video wählen
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <Camera className="h-8 w-8 text-[#A58C81] dark:text-[#EBE9E9] mx-auto mb-2" />
                        <p className="text-xs text-[#252422] dark:text-[#F4F1E8]">Aufnehmen</p>
                      </div>
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-[#A58C81] dark:text-[#EBE9E9] mx-auto mb-2" />
                        <p className="text-xs text-[#252422] dark:text-[#F4F1E8]">Hochladen</p>
                      </div>
                    </div>
                    <p className="text-xs text-center text-[#A58C81] dark:text-[#EBE9E9]">
                      Video mit Kamera aufnehmen oder Datei auswählen
                    </p>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                      MP4, MOV, AVI, WEBM (max. 100MB)
                    </p>
                  </>
                )}
              </label>
            </div>
            {isMobile && (
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex-1 min-h-[52px] px-4 py-3 rounded-lg font-semibold transition-colors text-base touch-manipulation bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-[#252422] dark:text-[#F4F1E8] flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-5 w-5" /> Zurück
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!videoFile}
                  className={`flex-1 min-h-[52px] px-4 py-3 rounded-lg font-semibold transition-colors text-base touch-manipulation flex items-center justify-center gap-2 ${
                    !videoFile
                      ? 'bg-gray-400 cursor-not-allowed opacity-60 text-white'
                      : 'bg-[#A58C81] hover:bg-[#8a7268] active:bg-[#7a6258] text-white shadow-md'
                  }`}
                >
                  Weiter <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Beer Drink Time */}
        {((isMobile && currentStep === (hasDeviceEntries ? 5 : 4)) || !isMobile) && (
          <div className={`${isMobile ? '' : 'mb-6'}`}>
            <h3 className="text-base sm:text-lg font-semibold text-[#252422] dark:text-[#F4F1E8] mb-4">
            5. Wie schnell hast du dein Bier getrunken? (Die Zeit im Video)
            </h3>
            <label htmlFor="beer_drink_time" className="block text-sm sm:text-base font-semibold text-[#252422] dark:text-[#F4F1E8] mb-2">
              Bier-Trinkzeit (in Sekunden) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="beer_drink_time"
              name="beer_drink_time"
              inputMode="numeric"
              value={formData.beer_drink_time}
              onChange={handleChange}
              min="0"
              step="1"
              required
              className="w-full px-4 py-3.5 sm:py-2.5 text-base sm:text-sm border-2 border-[#A58C81]/40 dark:border-[#EBE9E9]/40 focus:border-[#A58C81] dark:focus:border-[#EBE9E9] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#F4F1E8] touch-manipulation"
              placeholder="z.B. 45"
            />
            <p className="mt-2 text-xs sm:text-sm text-[#A58C81] dark:text-[#EBE9E9]">
              Zeit in Sekunden, die du zum Trinken des Biers benötigt haben.
            </p>
            {isMobile && (
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex-1 min-h-[52px] px-4 py-3 rounded-lg font-semibold transition-colors text-base touch-manipulation bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-[#252422] dark:text-[#F4F1E8] flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-5 w-5" /> Zurück
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!formData.beer_drink_time || parseInt(formData.beer_drink_time, 10) < 0}
                  className={`flex-1 min-h-[52px] px-4 py-3 rounded-lg font-semibold transition-colors text-base touch-manipulation flex items-center justify-center gap-2 ${
                    !formData.beer_drink_time || parseInt(formData.beer_drink_time, 10) < 0
                      ? 'bg-gray-400 cursor-not-allowed opacity-60 text-white'
                      : 'bg-[#A58C81] hover:bg-[#8a7268] active:bg-[#7a6258] text-white shadow-md'
                  }`}
                >
                  Weiter <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Drinking Rules Consent */}
        {((isMobile && currentStep === (hasDeviceEntries ? 6 : 5)) || !isMobile) && (
          <div className={`${isMobile ? '' : 'mb-6'}`}>
            <h3 className="text-base sm:text-lg font-semibold text-[#252422] dark:text-[#F4F1E8] mb-4">
              {hasDeviceEntries ? '6' : '5'}. Trinkregeln akzeptieren
            </h3>
            <label className="flex items-start gap-3 cursor-pointer touch-manipulation min-h-[52px] sm:min-h-[44px] py-2 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                name="drinking_rules_consent"
                checked={formData.drinking_rules_consent}
                onChange={handleChange}
                required
                className="mt-1.5 h-6 w-6 sm:h-5 sm:w-5 text-[#A58C81] border-[#A58C81] rounded focus:ring-[#A58C81] touch-manipulation"
              />
              <span className="text-sm sm:text-base text-[#252422] dark:text-[#F4F1E8] flex-1 pt-1">
                Ich akzeptiere die <a href="/wettbewerbsrichtlinien-bier-wettbewerb.pdf" target="_blank" rel="noopener noreferrer" className="text-[#A58C81] dark:text-[#EBE9E9] underline hover:text-[#8a7268] dark:hover:text-[#d4d2d2]">Trinkregeln</a> und verstehe, dass ich vom Wettbewerb ausgeschlossen werden kann, wenn ich meine Grenzen überschreite oder zu betrunken bin. <span className="text-red-500">*</span>
              </span>
            </label>
            {isMobile && (
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex-1 min-h-[52px] px-4 py-3 rounded-lg font-semibold transition-colors text-base touch-manipulation bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-[#252422] dark:text-[#F4F1E8] flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-5 w-5" /> Zurück
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!formData.drinking_rules_consent}
                  className={`flex-1 min-h-[52px] px-4 py-3 rounded-lg font-semibold transition-colors text-base touch-manipulation flex items-center justify-center gap-2 ${
                    !formData.drinking_rules_consent
                      ? 'bg-gray-400 cursor-not-allowed opacity-60 text-white'
                      : 'bg-[#A58C81] hover:bg-[#8a7268] active:bg-[#7a6258] text-white shadow-md'
                  }`}
                >
                  Weiter <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 7: DSGVO Consent */}
        {((isMobile && currentStep === (hasDeviceEntries ? 7 : 6)) || !isMobile) && (
          <div className={`${isMobile ? '' : 'mb-6'}`}>
            <h3 className="text-base sm:text-lg font-semibold text-[#252422] dark:text-[#F4F1E8] mb-4">
              {hasDeviceEntries ? '7' : '6'}. Datenschutz-Einverständnis
            </h3>
            <label className="flex items-start gap-3 cursor-pointer touch-manipulation min-h-[52px] sm:min-h-[44px] py-2 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                name="dsgvo_consent"
                checked={formData.dsgvo_consent}
                onChange={handleChange}
                required
                className="mt-1.5 h-6 w-6 sm:h-5 sm:w-5 text-[#A58C81] border-[#A58C81] rounded focus:ring-[#A58C81] touch-manipulation"
              />
              <span className="text-sm sm:text-base text-[#252422] dark:text-[#F4F1E8] flex-1 pt-1">
                Ich willige in die Verarbeitung meiner personenbezogenen Daten und meines Videos ein. Ich habe die <a href="/datenschutzerklaerung.pdf" target="_blank" rel="noopener noreferrer" className="text-[#A58C81] dark:text-[#EBE9E9] underline hover:text-[#8a7268] dark:hover:text-[#d4d2d2]">Datenschutzerklärung</a> gelesen und akzeptiere sie. <span className="text-red-500">*</span>
              </span>
            </label>
            {isMobile && (
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex-1 min-h-[52px] px-4 py-3 rounded-lg font-semibold transition-colors text-base touch-manipulation bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-[#252422] dark:text-[#F4F1E8] flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-5 w-5" /> Zurück
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.dsgvo_consent || !formData.drinking_rules_consent || !canProceedToNextStep()}
                  className={`flex-1 min-h-[52px] px-4 py-3 rounded-lg font-semibold transition-colors text-base touch-manipulation flex items-center justify-center gap-2 ${
                    loading || !formData.dsgvo_consent || !formData.drinking_rules_consent || !canProceedToNextStep()
                      ? 'bg-gray-400 cursor-not-allowed opacity-60 text-white'
                      : 'bg-[#A58C81] hover:bg-[#8a7268] active:bg-[#7a6258] text-white shadow-md'
                  }`}
                >
                  {loading ? 'Wird hochgeladen...' : 'Absenden'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submit Button - Desktop Only */}
        {!isMobile && (
          <div className="pt-3 sm:pt-2">
            <button
              type="submit"
              disabled={loading || !videoFile || !formData.dsgvo_consent || !formData.drinking_rules_consent}
              className={`w-full min-h-[52px] sm:min-h-[48px] px-6 py-3.5 sm:py-3 rounded-lg font-semibold transition-colors text-base touch-manipulation ${
                loading || !videoFile || !formData.dsgvo_consent || !formData.drinking_rules_consent
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-[#A58C81] hover:bg-[#8a7268] active:bg-[#7a6258] text-white shadow-md'
              }`}
            >
              {loading ? 'Wird hochgeladen...' : 'Einreichen'}
            </button>
          </div>
        )}

        {loading && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
            <div
              className="bg-[#A58C81] h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </form>
        </>
      )}

    </div>
  );
};

export default NikolausfeierForm;

