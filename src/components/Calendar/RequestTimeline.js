// FILE OVERVIEW
// - Purpose: Visual timeline component for a single event request, showing stages like requested, accepted, details, and final approval.
// - Used by: Event request tracking / profile views to show the current status of a user’s request.
// - Notes: Production UI component. Styling depends on dark mode and request.request_stage values.

import React from 'react';
import { useDarkMode } from '../../contexts/DarkModeContext';

const RequestTimeline = ({ request }) => {
  const { isDarkMode } = useDarkMode();
  
  const stages = [
    { id: 'initial', name: 'Anfrage', number: 1 },
    { id: 'initial_accepted', name: 'Akzeptiert', number: 2 },
    { id: 'details_submitted', name: 'Details', number: 3 },
    { id: 'final_accepted', name: 'Freigegeben', number: 4 }
  ];

  const getStageStatus = (stageId) => {
    if (request.request_stage === 'rejected' || request.request_stage === 'cancelled') return 'rejected';
    
    const stageOrder = ['initial', 'initial_accepted', 'details_submitted', 'final_accepted'];
    const currentIndex = stageOrder.indexOf(request.request_stage);
    const stageIndex = stageOrder.indexOf(stageId);
    
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'pending';
  };

  if (request.request_stage === 'rejected') {
    return (
      <div className={`bg-red-50 ${isDarkMode ? 'dark:bg-red-900/20' : ''} border border-red-200 ${isDarkMode ? 'dark:border-red-800' : ''} rounded-lg p-3`}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">✕</div>
          <div>
            <p className={`text-sm font-semibold text-red-900 ${isDarkMode ? 'dark:text-red-300' : ''}`}>
              Anfrage abgelehnt
            </p>
            {request.rejection_reason && (
              <p className={`text-xs text-red-700 ${isDarkMode ? 'dark:text-red-400' : ''} mt-1`}>
                {request.rejection_reason}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (request.request_stage === 'cancelled') {
    return (
      <div className={`bg-gray-50 ${isDarkMode ? 'dark:bg-gray-900/20' : ''} border border-gray-200 ${isDarkMode ? 'dark:border-gray-700' : ''} rounded-lg p-3`}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold">✕</div>
          <div>
            <p className={`text-sm font-semibold text-gray-900 ${isDarkMode ? 'dark:text-gray-300' : ''}`}>
              Anfrage storniert
            </p>
            <p className={`text-xs text-gray-700 ${isDarkMode ? 'dark:text-gray-400' : ''} mt-1`}>
              Diese Anfrage wurde von Ihnen storniert.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Enhanced Timeline with Labels */}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const status = getStageStatus(stage.id);
          const isLast = index === stages.length - 1;
          
          return (
            <div key={stage.id} className="relative flex items-start">
              {/* Timeline Circle */}
              <div className="flex flex-col items-center mr-3">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold z-10
                  ${status === 'completed' ? `bg-green-500 ${isDarkMode ? 'dark:bg-green-500' : ''} text-white` : ''}
                  ${status === 'current' ? `bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#A58C81]' : ''} text-white animate-pulse` : ''}
                  ${status === 'pending' ? `bg-gray-300 ${isDarkMode ? 'dark:bg-gray-600' : ''} text-gray-500` : ''}
                  transition-all duration-300
                `}>
                  {status === 'completed' ? '✓' : stage.number}
                </div>
                
                {/* Vertical Line */}
                {!isLast && (
                  <div className={`
                    w-0.5 flex-1 mt-2
                    ${status === 'completed' ? `bg-green-500 ${isDarkMode ? 'dark:bg-green-500' : ''}` : `bg-gray-300 ${isDarkMode ? 'dark:bg-gray-600' : ''}`}
                  `} style={{ minHeight: '2rem' }} />
                )}
              </div>
              
              {/* Stage Info */}
              <div className="flex-1 pt-1">
                <p className={`text-sm font-semibold ${
                  status === 'completed' ? `text-green-700 ${isDarkMode ? 'dark:text-green-300' : ''}` : 
                  status === 'current' ? `text-[#A58C81] ${isDarkMode ? 'dark:text-[#A58C81]' : ''}` : 
                  `text-gray-400 ${isDarkMode ? 'dark:text-gray-500' : ''}`
                }`}>
                  {stage.name}
                </p>
                {status === 'current' && (
                  <p className={`text-xs text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} mt-1`}>
                    {request.request_stage === 'initial' && 'Wird gerade geprüft...'}
                    {request.request_stage === 'initial_accepted' && !request.details_submitted_at && 'Bitte Details ausfüllen →'}
                    {request.request_stage === 'initial_accepted' && request.details_submitted_at && 'Details bereits eingereicht ✓'}
                    {request.request_stage === 'details_submitted' && 'Wird final geprüft...'}
                    {request.request_stage === 'final_accepted' && 'Freigegeben ✓'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Notes (if any) */}
      {request.admin_notes && (
        <div className={`mt-4 p-3 rounded-lg bg-blue-50 ${isDarkMode ? 'dark:bg-blue-900/20' : ''} border border-blue-200 ${isDarkMode ? 'dark:border-blue-800' : ''}`}>
          <p className={`text-xs text-blue-800 ${isDarkMode ? 'dark:text-blue-300' : ''} italic`}>
            <strong>Hinweis:</strong> {request.admin_notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default RequestTimeline;
