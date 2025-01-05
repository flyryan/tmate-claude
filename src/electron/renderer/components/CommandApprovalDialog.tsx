import React, { memo, useEffect } from 'react';

interface CommandApprovalDialogProps {
  command: string;
  onApprove: () => void;
  onReject: () => void;
  isOpen: boolean;
}

export const CommandApprovalDialog: React.FC<CommandApprovalDialogProps> = memo(({
  command,
  onApprove,
  onReject,
  isOpen
}) => {
  useEffect(() => {
    if (!isOpen) return;

  const handleKeyDown = (e: globalThis.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('Approving via Enter key');
      onApprove();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      console.log('Rejecting via Escape key');
      onReject();
    }
  };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onApprove, onReject]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800/90 backdrop-blur border border-gray-700/50 rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
        <div className="p-4 border-b border-gray-700/50">
          <h3 className="text-lg font-medium text-gray-200">Approve Command</h3>
          <p className="mt-1 text-sm text-gray-400">
            Review the command before execution
          </p>
        </div>

        <div className="p-4">
          <div className="bg-gray-900/50 rounded p-3 font-mono text-sm">
            {command}
          </div>

          <div className="mt-4 text-sm text-gray-400">
            <p>This command will be executed in the current working directory.</p>
            <p className="mt-2">Make sure you trust this command before approving.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-4 py-3 bg-gray-900/30">
          <button
            onClick={() => {
            console.log('Rejecting via button click');
            onReject();
          }}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
          >
            Reject (Esc)
          </button>
          <button
            onClick={() => {
            console.log('Approving via button click');
            onApprove();
          }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
          >
            Approve (Enter)
          </button>
        </div>
      </div>
    </div>
  );
});

CommandApprovalDialog.displayName = 'CommandApprovalDialog';
