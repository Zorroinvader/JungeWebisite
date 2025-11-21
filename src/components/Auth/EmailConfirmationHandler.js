// FILE OVERVIEW
// - Purpose: Handles email confirmation flow when users click confirmation links; exchanges tokens and redirects appropriately.
// - Used by: App.js when URL contains confirmation tokens (token, type, or access_token in hash); shown before normal routing.
// - Notes: Production component. Critical for user registration flow; handles Supabase auth token exchange and session setup.

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { CheckCircle, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const EmailConfirmationHandler = () => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(null);
  const redirectTimerRef = useRef(null);
  // Fix Bug 1 & 3: Create refs to avoid stale closure in timeout callback
  const confirmedRef = useRef(false);
  const errorRef = useRef(null);
  
  // Fix Bug 1 (Race Condition): Sync refs with state using useEffect to avoid race conditions
  useEffect(() => {
    confirmedRef.current = confirmed;
    errorRef.current = error;
  }, [confirmed, error]);

  // Navigate to login with activation notification
  const goToLogin = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        // Redirect to login page with activation notification
        const loginUrl = '/login?activated=true';
        if (window.location.pathname === '/login') {
          // If already on login, reload with the parameter
          window.location.href = loginUrl;
        } else {
          window.location.assign(loginUrl);
        }
      } else {
        navigate('/login?activated=true', { replace: true });
      }
    } catch (e) {
      navigate('/login?activated=true', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check if URL has confirmation parameters in hash (most common for Supabase)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type') || urlParams.get('type') || (hashParams.get('token_hash') || urlParams.get('token_hash') ? 'signup' : null);
        const token = urlParams.get('token');
        const tokenHash = hashParams.get('token_hash') || urlParams.get('token_hash');
        const email = hashParams.get('email') || urlParams.get('email');
        // Handle hash-based token (most common Supabase flow)
        if (accessToken) {
          // Extract token and type from hash
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');

          if (access_token && refresh_token) {
            // Set the session directly with the tokens from the hash
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token
            });

            if (sessionError) {
              setError(sessionError.message || 'E-Mail-Bestätigung fehlgeschlagen. Bitte versuchen Sie sich anzumelden.');
              setChecking(false);
              return;
            }

            if (session?.user) {
              // Set confirmed state FIRST to show success message
              setConfirmed(true);
              setChecking(false);
              
              // Clean up the URL AFTER state is set (use setTimeout to ensure state update happens first)
              setTimeout(() => {
                window.history.replaceState({}, document.title, window.location.pathname);
              }, 100);
              
              // Redirect to login page immediately with activation notification
              redirectTimerRef.current = setTimeout(() => {
                goToLogin();
              }, 2000); // Reduced to 2 seconds for faster redirect
            } else {
            }
          } else {
          }
        }

        // Handle OTP-based token (alternative flow)
        if (tokenHash || token) {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash || token,
            type: 'signup',
            email: email || undefined
          });

          if (verifyError) {
            // Don't set error yet, try other methods first
          } else if (data?.user) {
            // Set confirmed state FIRST to show success message
            setConfirmed(true);
            setChecking(false);
            
            // Clean up the URL AFTER state is set
            setTimeout(() => {
              window.history.replaceState({}, document.title, window.location.pathname);
            }, 100);
            
            // Redirect to login page immediately with activation notification
            redirectTimerRef.current = setTimeout(() => {
              goToLogin();
            }, 2000); // Reduced to 2 seconds for faster redirect
            return;
          }
        }

        // Try to get session (might work if Supabase auto-handled it)
        // Retry a few times to allow Supabase to finalize the session
        for (let attempt = 0; attempt < 10; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 300));
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Consider any valid session as success (email_confirmed_at can lag)
            setConfirmed(true);
            setChecking(false);
            
            // Clean up the URL AFTER state is set
            setTimeout(() => {
              window.history.replaceState({}, document.title, window.location.pathname);
            }, 100);
            
            // Redirect to login page immediately with activation notification
            redirectTimerRef.current = setTimeout(() => {
              goToLogin();
            }, 2000); // Reduced to 2 seconds for faster redirect
            return;
          }
        }

        // If we have any confirmation params but nothing worked, show error
        const hasAnyParams = accessToken || tokenHash || token || type;
        
        if (hasAnyParams) {
          setError('E-Mail-Bestätigung konnte nicht abgeschlossen werden. Ihr Konto könnte bereits bestätigt sein. Bitte versuchen Sie sich anzumelden.');
        } else {
          setError('Keine Bestätigungsparameter gefunden. Bitte verwenden Sie den Link aus Ihrer E-Mail.');
        }
        
        setChecking(false);
      } catch (err) {
        setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie sich anzumelden.');
        setChecking(false);
      }
    };

    // Also react to auth state changes (covers cases without URL params)
    // Fix Bug 2: Correct destructuring pattern - use { data: { subscription } }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setConfirmed(true);
        // Fix Bug 1: Don't manually update ref here - let the useEffect sync it
        // This prevents race conditions where the ref gets overwritten immediately after
        setChecking(false);
      }
    });

    // Fix Bug 1 & 3: Set timeout for error handling - use refs to avoid stale closure
    const timeoutId = setTimeout(() => {
      // Use refs to get current values, avoiding stale closure
      // Refs are synced via separate useEffect above, so they always have current state
      if (!confirmedRef.current && !errorRef.current) {
        setError('Die Bestätigung dauert länger als erwartet. Bitte versuchen Sie sich anzumelden oder kontaktieren Sie den Administrator.');
        setChecking(false);
      }
    }, 5000);

    handleEmailConfirmation();

    // Cleanup timeout and redirect timer on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      // Fix Bug 2: Use subscription directly
      if (subscription) subscription.unsubscribe();
    };
  }, [navigate, goToLogin]); // Include goToLogin in dependencies

  if (checking) {
    return (
      <div className={`min-h-screen bg-[#F4F1E8] ${isDarkMode ? 'dark:bg-[#252422]' : ''} flex items-center justify-center`}>
        <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-2xl shadow-xl p-12 max-w-md w-full text-center border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}>
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#A58C81] mx-auto mb-6"></div>
          <h2 className={`text-2xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-4`}>
            E-Mail wird bestätigt...
          </h2>
          <p className={`text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
            Bitte warten Sie einen Moment.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-[#F4F1E8] ${isDarkMode ? 'dark:bg-[#252422]' : ''} flex items-center justify-center p-4`}>
        <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-2xl shadow-xl p-12 max-w-md w-full text-center border-2 border-red-400 ${isDarkMode ? 'dark:border-red-600' : ''}`}>
          <AlertCircle className={`w-20 h-20 text-red-600 mx-auto mb-6`} />
          <h2 className={`text-3xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-4`}>
            Fehler bei der Bestätigung
          </h2>
          <p className={`text-lg text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-4`}>
            {error}
          </p>
          <p className={`text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-6`}>
            Bitte versuchen Sie sich anzumelden oder kontaktieren Sie den Administrator.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => goToLogin()}
              className={`w-full px-6 py-3 bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} text-white rounded-lg hover:opacity-90 transition-opacity font-semibold`}
            >
              Zur Anmeldung
            </button>
            <button
              onClick={() => window.location.assign('/')}
              className={`w-full px-6 py-3 border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} rounded-lg hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''} transition-colors font-semibold`}
            >
              Zur Startseite
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Don't return null - always show something
  // If not confirmed and not checking and no error, show a default state
  if (!confirmed && !checking && !error) {
    // This shouldn't happen, but handle gracefully
    return (
      <div className={`min-h-screen bg-[#F4F1E8] ${isDarkMode ? 'dark:bg-[#252422]' : ''} flex items-center justify-center p-4`}>
        <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-2xl shadow-xl p-12 max-w-md w-full text-center border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}>
          <Mail className={`w-20 h-20 text-[#A58C81] mx-auto mb-6`} />
          <h2 className={`text-2xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-4`}>
            Bestätigung wird verarbeitet...
          </h2>
          <button
            onClick={() => goToLogin()}
            className={`w-full px-6 py-3 bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} text-white rounded-lg hover:opacity-90 transition-opacity font-semibold mt-4`}
          >
            Zur Anmeldung
          </button>
        </div>
      </div>
    );
  }

  // Show success message when confirmed
  if (confirmed) {
    return (
      <div className={`min-h-screen bg-[#F4F1E8] ${isDarkMode ? 'dark:bg-[#252422]' : ''} flex items-center justify-center p-4`}>
        <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-2xl shadow-xl p-12 max-w-md w-full text-center border-2 border-green-500 ${isDarkMode ? 'dark:border-green-400' : ''}`}>
          <CheckCircle className={`w-20 h-20 text-green-600 ${isDarkMode ? 'dark:text-green-400' : ''} mx-auto mb-6 animate-pulse`} />
          <h2 className={`text-3xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-4`}>
            Email Aktivierung erfolgreich!
          </h2>
          <p className={`text-xl font-semibold text-green-600 ${isDarkMode ? 'dark:text-green-400' : ''} mb-4`}>
            ✓ E-Mail bestätigt
          </p>
          <p className={`text-lg text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-2`}>
            Willkommen bei Junge Gesellschaft!
          </p>
          <p className={`text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-6`}>
            Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Sie werden in wenigen Sekunden zur Anmeldeseite weitergeleitet...
          </p>
          <button
            onClick={() => {
              if (redirectTimerRef.current) {
                clearTimeout(redirectTimerRef.current);
                redirectTimerRef.current = null;
              }
              goToLogin();
            }}
            className={`w-full px-6 py-3 bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} text-white rounded-lg hover:opacity-90 transition-opacity font-semibold`}
          >
            Jetzt zur Anmeldung
          </button>
        </div>
      </div>
    );
  }

  // Should not reach here if everything works correctly
  return null;
};

export default EmailConfirmationHandler;

