import React, { memo } from 'react';

interface TerminalSectionProps {
  status: 'idle' | 'sending' | 'executing' | 'approving';
}

export const TerminalSection: React.FC<TerminalSectionProps> = memo(({ status }) => {
  console.log('TerminalSection rendering with status:', status);
  
  return (
    <div className="bg-black/50 backdrop-blur rounded-lg p-4 h-full border border-gray-800/50 relative">
      <div className="font-mono h-full text-gray-300 flex flex-col">
        <div className="flex items-center gap-2 text-blue-400 sticky top-0">
          {status === 'executing' ? (
            <>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-current animate-bounce-delayed-1" />
                <div className="w-2 h-2 rounded-full bg-current animate-bounce-delayed-2" />
              </div>
              <span className="text-sm font-medium">Executing command...</span>
            </>
          ) : (
            <span className="text-gray-500 text-sm">
              Terminal output will appear here
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

TerminalSection.displayName = 'TerminalSection';
