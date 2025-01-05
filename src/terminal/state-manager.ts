import { TerminalState, StateChange } from './types';

export class StateManager {
  private currentState: TerminalState;
  private stateHistory: StateChange[];
  private maxHistorySize: number;

  constructor(initialCwd: string = process.cwd()) {
    this.currentState = {
      cwd: initialCwd,
      env: { ...process.env } as Record<string, string>,
      commandHistory: [],
      processTree: [process.pid]
    };
    this.stateHistory = [];
    this.maxHistorySize = 1000;
  }

  updateState(changes: Partial<TerminalState>): void {
    const timestamp = Date.now();

    // Track each change separately
    if (changes.cwd && changes.cwd !== this.currentState.cwd) {
      this.addStateChange('cwd', timestamp, changes.cwd);
      this.currentState.cwd = changes.cwd;
    }

    if (changes.env) {
      const envChanges = this.detectEnvChanges(changes.env);
      if (Object.keys(envChanges).length > 0) {
        this.addStateChange('env', timestamp, envChanges);
        this.currentState.env = { ...this.currentState.env, ...changes.env };
      }
    }

    if (changes.commandHistory) {
      const newCommands = changes.commandHistory.filter(
        cmd => !this.currentState.commandHistory.includes(cmd)
      );
      if (newCommands.length > 0) {
        this.addStateChange('command', timestamp, newCommands);
        this.currentState.commandHistory = [
          ...this.currentState.commandHistory,
          ...newCommands
        ];
      }
    }

    if (changes.processTree) {
      const processChanges = this.detectProcessChanges(changes.processTree);
      if (processChanges.length > 0) {
        this.addStateChange('process', timestamp, processChanges);
        this.currentState.processTree = changes.processTree;
      }
    }
  }

  private detectEnvChanges(newEnv: Record<string, string>): Record<string, string> {
    const changes: Record<string, string> = {};
    for (const [key, value] of Object.entries(newEnv)) {
      if (this.currentState.env[key] !== value) {
        changes[key] = value;
      }
    }
    return changes;
  }

  private detectProcessChanges(newProcessTree: number[]): number[] {
    return newProcessTree.filter(pid => !this.currentState.processTree.includes(pid));
  }

  private addStateChange(type: StateChange['type'], timestamp: number, data: any): void {
    this.stateHistory.push({ type, timestamp, data });
    this.maintainHistorySize();
  }

  private maintainHistorySize(): void {
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory = this.stateHistory.slice(-this.maxHistorySize);
    }
  }

  getSnapshot(): TerminalState {
    return { ...this.currentState };
  }

  getStateHistory(): StateChange[] {
    return [...this.stateHistory];
  }

  async restore(snapshot: TerminalState): Promise<void> {
    // Validate snapshot
    if (!this.isValidSnapshot(snapshot)) {
      throw new Error('Invalid terminal state snapshot');
    }

    // Record the restoration as a state change
    const timestamp = Date.now();
    this.addStateChange('cwd', timestamp, snapshot.cwd);
    this.addStateChange('env', timestamp, snapshot.env);
    this.addStateChange('command', timestamp, snapshot.commandHistory);
    this.addStateChange('process', timestamp, snapshot.processTree);

    // Update current state
    this.currentState = { ...snapshot };
  }

  private isValidSnapshot(snapshot: any): snapshot is TerminalState {
    return (
      snapshot &&
      typeof snapshot.cwd === 'string' &&
      snapshot.env && typeof snapshot.env === 'object' &&
      Array.isArray(snapshot.commandHistory) &&
      Array.isArray(snapshot.processTree) &&
      snapshot.processTree.every((pid: any) => typeof pid === 'number')
    );
  }

  trackChanges(): StateChange[] {
    return this.stateHistory;
  }

  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;
    this.maintainHistorySize();
  }

  clearHistory(): void {
    this.stateHistory = [];
  }

  getCurrentWorkingDirectory(): string {
    return this.currentState.cwd;
  }

  getEnvironmentVariables(): Record<string, string> {
    return { ...this.currentState.env };
  }

  getCommandHistory(): string[] {
    return [...this.currentState.commandHistory];
  }

  getProcessTree(): number[] {
    return [...this.currentState.processTree];
  }
}
