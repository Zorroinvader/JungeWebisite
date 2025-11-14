import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Users } from 'lucide-react';
import { useDarkMode } from '../../contexts/DarkModeContext';

const GuestOrRegisterModal = ({ isOpen, onClose, onContinueAsGuest, selectedDate }) => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleRegister = () => {
    // Store the selected date for after registration
    if (selectedDate) {
      sessionStorage.setItem('pendingEventDate', selectedDate);
    }
    sessionStorage.setItem('pendingEventRequest', 'true');
    navigate('/register');
    onClose();
  };

  const handleLogin = () => {
    // Store the selected date for after login
    if (selectedDate) {
      sessionStorage.setItem('pendingEventDate', selectedDate);
    }
    sessionStorage.setItem('pendingEventRequest', 'true');
    navigate('/login');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className={`relative bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-xl sm:rounded-2xl shadow-xl max-w-2xl w-full border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''} max-h-[95vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`p-4 sm:p-6 md:p-8 border-b border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''}`}>
          <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} text-center mb-2 sm:mb-3`}>
            Event anfragen
          </h2>
          <p className={`text-center text-sm sm:text-base md:text-lg text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} font-medium mb-1 sm:mb-2`}>
            Sie haben ein Konto?
          </p>
          <p className={`text-center text-xs sm:text-sm text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
            Melden Sie sich an, um schneller zu sein, oder erstellen Sie ein neues Konto
          </p>
        </div>

        {/* Options */}
        <div className="p-4 sm:p-6 md:p-8">
          {/* Account Options - Login/Register */}
          <div className={`border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} bg-opacity-5 ${isDarkMode ? 'dark:bg-opacity-10' : ''} mb-4 sm:mb-6`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} flex items-center justify-center mb-3 sm:mb-4`}>
                <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className={`text-base sm:text-lg md:text-xl font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-2`}>
                Mit Konto schneller sein
              </h3>
              <p className={`text-xs sm:text-sm text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-3 sm:mb-4`}>
                Ihre Daten werden automatisch ausgefüllt
              </p>
              <ul className={`text-xs text-left text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} space-y-1.5 sm:space-y-2 mb-4 sm:mb-6`}>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Kontaktdaten automatisch ausfüllen</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Alle Anfragen an einem Ort verwalten</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Schneller bei zukünftigen Anfragen</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Anfragen jederzeit stornieren</span>
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                <button
                  onClick={handleLogin}
                  className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} text-white rounded-lg hover:opacity-90 transition-opacity font-semibold`}
                >
                  Anmelden
                </button>
                <button
                  onClick={handleRegister}
                  className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} rounded-lg hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''} transition-colors font-semibold`}
                >
                  Neues Konto erstellen
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-4 sm:mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''}`}></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className={`px-3 sm:px-4 bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
                oder
              </span>
            </div>
          </div>

          {/* Guest Option - New Request */}
          <div
            onClick={onContinueAsGuest}
            className={`cursor-pointer border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''} transition-all hover:shadow-lg group`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 ${isDarkMode ? 'dark:bg-gray-800' : ''} flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-[#A58C81] ${isDarkMode ? 'dark:group-hover:bg-[#6a6a6a]' : ''} transition-colors`}>
                <Users className={`w-6 h-6 sm:w-7 sm:h-7 text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} group-hover:text-white transition-colors`} />
              </div>
              <h3 className={`text-base sm:text-lg font-bold text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-2`}>
                Als Gast fortfahren
              </h3>
              <p className={`text-xs sm:text-sm text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mb-2 sm:mb-3`}>
                Schnelle Anfrage ohne Konto - Daten manuell eingeben
              </p>
              <div className={`px-4 sm:px-6 py-2 text-xs sm:text-sm bg-gray-100 ${isDarkMode ? 'dark:bg-gray-800' : ''} rounded-lg font-semibold text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} group-hover:bg-[#A58C81] ${isDarkMode ? 'dark:group-hover:bg-[#6a6a6a]' : ''} group-hover:text-white transition-colors`}>
                Ohne Konto fortfahren →
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <div className={`p-4 sm:p-6 border-t border-[#A58C81] ${isDarkMode ? 'dark:border-[#EBE9E9]' : ''}`}>
          <button
            onClick={onClose}
            className={`w-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#6a6a6a]' : ''} text-[#252422] ${isDarkMode ? 'dark:text-[#e0e0e0]' : ''} rounded-lg hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#1a1a1a]' : ''} transition-colors font-semibold`}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestOrRegisterModal;

