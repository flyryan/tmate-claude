export interface ChatMessageProps {
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

export interface ChatState {
  messages: ChatMessageProps[];
  input: string;
  status: 'idle' | 'sending' | 'executing';
}
