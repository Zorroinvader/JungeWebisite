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
      try {
        // Check if URL has confirmation parameters in hash (most common for Supabase)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type') || urlParams.get('type');
        const token = urlParams.get('token');
        const tokenHash = hashParams.get('token_hash');
        const email = hashParams.get('email') || urlParams.get('email');

        console.log('Email confirmation URL params:', { 
          accessToken: !!accessToken, 
          token: !!token,
          tokenHash: !!tokenHash,
          type, 
          email,
          hash: window.location.hash.substring(0, 50)
        });

        // Handle hash-based token (most common Supabase flow)
        if (accessToken && type === 'signup') {
          console.log('Processing hash-based email confirmation...');
          
          // Extract token and type from hash
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');
          const expires_in = hashParams.get('expires_in');
          const token_type = hashParams.get('token_type') || 'bearer';

          if (access_token && refresh_token) {
            // Set the session directly with the tokens from the hash
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token
            });

            if (sessionError) {
              console.error('Error setting session:', sessionError);
              setError(sessionError.message || 'E-Mail-Bestätigung fehlgeschlagen. Bitte versuchen Sie sich anzumelden.');
              setChecking(false);
              return;
            }

            if (session?.user) {
              console.log('Email confirmed successfully, user:', session.user.email);
              setConfirmed(true);
              setChecking(false);
              
              // Clean up the URL
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // Redirect to login page after 2 seconds
              setTimeout(() => {
                navigate('/login');
              }, 2000);
              return;
            }
          }
        }

        // Handle OTP-based token (alternative flow)
        if (tokenHash && email && type === 'signup') {
          console.log('Processing OTP-based email confirmation...');
          
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'signup'
          });

          if (verifyError) {
            console.error('Error verifying OTP:', verifyError);
            setError(verifyError.message || 'E-Mail-Bestätigung fehlgeschlagen. Bitte versuchen Sie sich anzumelden.');
            setChecking(false);
            return;
          }

          if (data?.user) {
            console.log('Email confirmed successfully via OTP, user:', data.user.email);
            setConfirmed(true);
            setChecking(false);
            
            // Clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
              navigate('/login');
            }, 2000);
            return;
          }
        }

        // Try to get session (might work if Supabase auto-handled it)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session?.user && session.user.email_confirmed_at) {
          console.log('Email already confirmed, session found:', session.user.email);
          setConfirmed(true);
          setChecking(false);
          
          // Clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Redirect to login page after 2 seconds
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }

        // No valid confirmation params or confirmation failed
        console.log('No valid confirmation params found or confirmation incomplete');
        setError('E-Mail-Bestätigung fehlgeschlagen. Bitte versuchen Sie sich anzumelden oder kontaktieren Sie den Administrator.');
        setChecking(false);
      } catch (err) {
        console.error('Error in email confirmation:', err);
        setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie sich anzumelden.');
        setChecking(false);
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

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
          Sie werden zur Anmeldeseite weitergeleitet...
        </p>
      </div>
    </div>
  );
};

export default EmailConfirmationHandler;

