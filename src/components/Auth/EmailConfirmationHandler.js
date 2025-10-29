import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { CheckCircle, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const EmailConfirmationHandler = () => {
  const { user } = useAuth();
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Check if URL has confirmation parameters
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const token = urlParams.get('token') || hashParams.get('access_token');
      const type = urlParams.get('type') || hashParams.get('type');

      console.log('Email confirmation URL params:', { token, type, hash: window.location.hash });

      if (token && type === 'signup') {
        try {
          console.log('Attempting to confirm email with token...');
          
          // Exchange the token for a session - use the full token, not just token_hash
          const { data, error: confirmError } = await supabase.auth.verifyOtp({
            token: token,
            type: 'signup'
          });

          if (confirmError) {
            console.error('Error verifying OTP:', confirmError);
            setError(confirmError.message);
            setChecking(false);
            return;
          }

          console.log('Email confirmed successfully:', data);
          setConfirmed(true);
          
          // Clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error('Error in email confirmation:', err);
          setError(err.message);
        } finally {
          setChecking(false);
        }
      } else {
        // No valid confirmation params
        console.log('No valid confirmation params found');
        setChecking(false);
      }
    };

    handleEmailConfirmation();
  }, []);

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
              onClick={() => navigate('/login')}
              className={`w-full px-6 py-3 bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} text-white rounded-lg hover:opacity-90 transition-opacity font-semibold`}
            >
              Zur Anmeldung
            </button>
            <button
              onClick={() => navigate('/')}
              className={`w-full px-6 py-3 border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} rounded-lg hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''} transition-colors font-semibold`}
            >
              Zur Startseite
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!confirmed) {
    return null;
  }

  return (
    <div className={`min-h-screen bg-[#F4F1E8] ${isDarkMode ? 'dark:bg-[#252422]' : ''} flex items-center justify-center p-4`}>
      <div className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-2xl shadow-xl p-12 max-w-md w-full text-center border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}>
        <CheckCircle className={`w-20 h-20 text-green-600 ${isDarkMode ? 'dark:text-green-400' : ''} mx-auto mb-6`} />
        <h2 className={`text-3xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-4`}>
          E-Mail bestätigt!
        </h2>
        <p className={`text-lg text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-2`}>
          Willkommen bei Junge Gesellschaft!
        </p>
        <p className={`text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-6`}>
          Ihr Konto wurde erfolgreich aktiviert. Sie können sich jetzt anmelden.
        </p>
        
        <button
          onClick={() => navigate('/')}
          className={`w-full px-6 py-3 bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} text-white rounded-lg hover:opacity-90 transition-opacity font-semibold`}
        >
          Zur Startseite
        </button>
      </div>
    </div>
  );
};

export default EmailConfirmationHandler;

