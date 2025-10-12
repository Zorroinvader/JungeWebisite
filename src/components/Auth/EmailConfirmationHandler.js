import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { CheckCircle, Mail } from 'lucide-react';

const EmailConfirmationHandler = () => {
  const { user } = useAuth();
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if URL has confirmation parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hasConfirmation = urlParams.has('token') || 
                           urlParams.has('type') || 
                           window.location.hash.includes('access_token');

    if (hasConfirmation) {
      // Wait a bit for auth to process
      const timer = setTimeout(() => {
        setChecking(false);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      // No confirmation in URL, don't show this component
      setChecking(false);
    }
  }, [user, navigate]);

  // Check if URL has confirmation params
  const urlParams = new URLSearchParams(window.location.search);
  const hasConfirmation = urlParams.has('token') || 
                         urlParams.has('type') || 
                         window.location.hash.includes('access_token');

  if (!hasConfirmation) {
    return null;
  }

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
          Sie sind jetzt angemeldet und können Event-Anfragen stellen.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/')}
            className={`w-full px-6 py-3 bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} text-white rounded-lg hover:opacity-90 transition-opacity font-semibold`}
          >
            Zur Startseite
          </button>
          <button
            onClick={() => navigate('/profile')}
            className={`w-full px-6 py-3 border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} rounded-lg hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''} transition-colors font-semibold`}
          >
            Zu meinem Profil
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationHandler;

