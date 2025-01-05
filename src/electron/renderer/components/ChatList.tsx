import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import type { ChatMessageProps } from './types';

interface ChatListProps {
  messages: ChatMessageProps[];
  className?: string;
}

export const ChatList: React.FC<ChatListProps> = ({ messages, className = '' }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={`flex flex-col gap-6 overflow-y-auto px-2 py-4 ${className}`}>
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          {...message}
        />
      ))}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
};
