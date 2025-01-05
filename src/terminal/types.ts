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

export interface PerformanceMetrics {
  latency: number;          // in milliseconds
  memoryUsage: number;      // in bytes
  cpuUsage: number;         // percentage (0-100)
  outputSize: number;       // in bytes
  bufferUtilization: number; // percentage (0-100)
}

export interface ResourceUsage {
  cpuUsage: number;         // percentage (0-100)
  memoryUsage: number;      // in bytes
  fileDescriptors: number;  // count
  networkConnections: number; // count
}

export interface ResourceLimits {
  maxCpuUsage: number;      // percentage (0-100)
  maxMemoryUsage: number;   // in bytes
  maxFileDescriptors: number; // count
  maxNetworkConnections: number; // count
  maxExecutionTime: number; // in milliseconds
  maxOutput: number;        // in bytes
}

export interface SecurityEvent {
  type: 'command_blocked' | 'resource_exceeded' | 'access_denied' | 'isolation_breach';
  timestamp: number;
  details: {
    command?: string;
    resource?: string;
    limit?: number;
    actual?: number;
    reason?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}
