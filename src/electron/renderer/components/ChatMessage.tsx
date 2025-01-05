import React, { memo } from 'react';
import { format } from 'date-fns';

interface ChatMessageProps {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    command?: string;
    status?: 'pending' | 'approved' | 'rejected';
    executionTime?: number;
  };
}

export const ChatMessage: React.FC<ChatMessageProps> = memo(({
  type,
  content,
  timestamp,
  metadata
}) => {
  const isCommand = !!metadata?.command;
  const hasStatus = !!metadata?.status;

  return (
    <div className={`chat-message ${type} flex flex-col gap-2 p-4 rounded-lg ${
      type === 'user' ? 'bg-gray-700/50' : 'bg-gray-800/50'
    } backdrop-blur border border-gray-700/50`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          type === 'user' ? 'bg-blue-400' : 'bg-green-400'
        } ring-2 ring-opacity-30 ${
          type === 'user' ? 'ring-blue-400' : 'ring-green-400'
        }`} />
        <span className="text-sm font-medium text-gray-300">
          {type === 'user' ? 'You' : 'Assistant'}
        </span>
        <span className="text-xs text-gray-500">
          {format(timestamp, 'h:mm a')}
        </span>
      </div>

      <div className="prose prose-invert prose-pre:bg-gray-900/50 prose-pre:border prose-pre:border-gray-700/50 max-w-none">
        {isCommand ? (
          <div className="flex flex-col gap-2">
            <pre className="bg-gray-900/50 p-2 rounded backdrop-blur">
              <code className="text-sm">{metadata.command}</code>
            </pre>
            {hasStatus && (
              <div className="flex items-center gap-2 mt-2">
                <div className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1.5 ${
                  metadata.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  metadata.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span className="capitalize">{metadata.status}</span>
                </div>
                {metadata.executionTime && (
                  <span className="text-xs text-gray-500">
                    Completed in {metadata.executionTime}ms
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{content}</div>
        )}
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
