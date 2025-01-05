import React, { useCallback } from 'react';

export const TitleBar: React.FC = () => {
  const handleMinimize = useCallback(() => {
    try {
      window.electronAPI?.window.minimize();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  }, []);

  const handleMaximize = useCallback(() => {
    try {
      window.electronAPI?.window.maximize();
    } catch (error) {
      console.error('Failed to maximize window:', error);
    }
  }, []);

  const handleClose = useCallback(() => {
    try {
      window.electronAPI?.window.close();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  }, []);

  return (
    <div className="h-9 flex items-center justify-between select-none drag">
      {/* App title */}
      <div className="flex items-center px-4 text-sm text-gray-300 drag">
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 mr-2 shadow-lg shadow-purple-500/20" />
        <span className="font-medium">TMate Claude</span>
        <span className="ml-2 text-xs text-gray-500">v1.0.0</span>
      </div>

      {/* Window controls */}
      <div className="flex h-full no-drag window-controls mr-1">
        <button
          onClick={handleMinimize}
          className="w-12 h-full hover:bg-gray-700/50 focus:outline-none"
          aria-label="Minimize"
        >
          <svg className="w-4 h-4 mx-auto text-gray-400" viewBox="0 0 16 16">
            <line x1="3" y1="8.5" x2="13" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-12 h-full hover:bg-gray-700/50 focus:outline-none"
          aria-label="Maximize"
        >
          <svg className="w-4 h-4 mx-auto text-gray-400" viewBox="0 0 16 16">
            <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="w-12 h-full close hover:bg-red-600/90 focus:outline-none"
          aria-label="Close"
        >
          <svg className="w-4 h-4 mx-auto text-gray-400" viewBox="0 0 16 16">
            <path
              d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
