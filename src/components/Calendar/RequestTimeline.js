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
    <div className="py-2">
      {/* Ultra Minimal Timeline: 1----2----3----4 */}
      <div className="flex items-center justify-between px-4">
        {stages.map((stage, index) => {
          const status = getStageStatus(stage.id);
          const isLast = index === stages.length - 1;
          const nextStatus = !isLast ? getStageStatus(stages[index + 1].id) : null;
          
          return (
            <React.Fragment key={stage.id}>
              {/* Number */}
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${status === 'completed' ? `bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#A58C81]' : ''} text-white` : ''}
                ${status === 'current' ? `bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#A58C81]' : ''} text-white` : ''}
                ${status === 'pending' ? `bg-gray-200 ${isDarkMode ? 'dark:bg-gray-700' : ''} text-gray-400` : ''}
              `}>
                {status === 'completed' ? '✓' : stage.number}
              </div>
              
              {/* Line: ---- */}
              {!isLast && (
                <div className={`
                  flex-1 h-px mx-1
                  ${status === 'completed' ? `bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#A58C81]' : ''}` : `bg-gray-200 ${isDarkMode ? 'dark:bg-gray-700' : ''}`}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Simple Status Text */}
      <p className={`text-xs text-center mt-2 text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
        {request.request_stage === 'initial' && 'Wird geprüft...'}
        {request.request_stage === 'initial_accepted' && 'Akzeptiert - Details ausfüllen'}
        {request.request_stage === 'details_submitted' && 'Wird final geprüft...'}
        {request.request_stage === 'final_accepted' && 'Freigegeben ✓'}
      </p>

      {/* Admin Notes (if any) */}
      {request.admin_notes && (
        <p className={`text-xs text-center mt-2 text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''} italic`}>
          "{request.admin_notes}"
        </p>
      )}
    </div>
  );
};

export default RequestTimeline;
