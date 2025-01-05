import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { ChatList } from './components/ChatList';
import { ChatInput } from './components/ChatInput';
import { CommandApprovalDialog } from './components/CommandApprovalDialog';
import type { ChatMessageProps } from './components/types';
import { v4 as uuidv4 } from 'uuid';
import { LoadingDots } from './components/LoadingDots';
import { TerminalSection } from './components/TerminalSection';

export const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageProps[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m ready to help you with terminal commands.',
      timestamp: new Date(Date.now() - 60000)
    },
    {
      id: '2',
      type: 'user',
      content: '!ls',
      timestamp: new Date(Date.now() - 45000),
      metadata: {
        command: '!ls',
        status: 'approved',
        executionTime: 42
      }
    },
    {
      id: '3',
      type: 'assistant',
      content: 'Here are the files in the current directory:\n\npackage.json\ntsconfig.json\nsrc/\ndist/',
      timestamp: new Date(Date.now() - 30000)
    }
  ]);
  const [status, setStatus] = useState<'idle' | 'sending' | 'executing' | 'approving'>('idle');
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const messageIdRef = useRef<string | null>(null);

  useEffect(() => {
    console.log('Status changed:', status);
  }, [status]);

  const handleSend = useCallback((content: string) => {
    const isCommand = content.startsWith('!') || content.startsWith('$');
    const messageId = uuidv4();
    const newMessage: ChatMessageProps = {
      id: messageId,
      type: 'user',
      content,
      timestamp: new Date(),
      metadata: isCommand ? { command: content, status: 'pending' } : undefined
    };

    setMessages(prev => [...prev, newMessage]);
    
    if (isCommand) {
      setStatus('approving');
      setPendingCommand(content);
      messageIdRef.current = messageId;
    } else {
      setStatus('sending');
      // Simulate assistant response for non-commands
      setTimeout(() => {
        const response: ChatMessageProps = {
          id: uuidv4(),
          type: 'assistant',
          content: `Received: ${content}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, response]);
        setStatus('idle');
      }, 3000);
    }
  }, []);

  const handleApprove = useCallback(() => {
    if (!pendingCommand || !messageIdRef.current) return;

    setMessages(prev => prev.map(msg => 
      msg.id === messageIdRef.current
        ? { ...msg, metadata: { ...msg.metadata, status: 'approved', executionTime: 42 } }
        : msg
    ));

    // Simulate command execution and response
    setStatus('executing');
    setTimeout(() => {
      const response: ChatMessageProps = {
        id: uuidv4(),
        type: 'assistant',
        content: `Executed command: ${pendingCommand}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response]);
      setStatus('idle');
      setPendingCommand(null);
      messageIdRef.current = null;
    }, 3000);
  }, [pendingCommand]);

  const handleReject = useCallback(() => {
    if (!messageIdRef.current) return;

    setMessages(prev => prev.map(msg => 
      msg.id === messageIdRef.current
        ? { ...msg, metadata: { ...msg.metadata, status: 'rejected' } }
        : msg
    ));

    setStatus('idle');
    setPendingCommand(null);
    messageIdRef.current = null;
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <TitleBar />
      <main className="flex-1 overflow-hidden">
        <div className="container mx-auto px-6 py-4 h-full max-w-[1920px]">
          <div className="grid grid-cols-2 gap-6 h-full">
            <TerminalSection status={status} />
            
            {/* Chat section */}
            <div className="bg-gray-800/50 backdrop-blur rounded-lg flex flex-col h-full border border-gray-700/50">
              <ChatList
                messages={messages}
                className="flex-1 overflow-y-auto mb-4"
              />
            <ChatInput
              onSend={handleSend}
              disabled={status !== 'idle'}
              placeholder={
                status === 'sending' ? 'Sending...' :
                status === 'executing' ? 'Executing command...' :
                status === 'approving' ? 'Waiting for approval...' :
                'Type your message...'
              }
            />
            <CommandApprovalDialog
              command={pendingCommand || ''}
              isOpen={status === 'approving'}
              onApprove={handleApprove}
              onReject={handleReject}
            />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
