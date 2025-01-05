export interface Session {
  id: string;
  pid: number;
  cols: number;
  rows: number;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: Error;
}

export interface TerminalState {
  cwd: string;
  env: Record<string, string>;
  commandHistory: string[];
  processTree: number[];
}

export interface StateChange {
  type: 'cwd' | 'env' | 'command' | 'process';
  timestamp: number;
  data: any;
}

export type OutputCallback = (data: string) => void;
