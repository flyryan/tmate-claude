import * as pty from 'node-pty';
import { v4 as uuidv4 } from 'uuid';
import { Session, OutputCallback } from './types';

export class PTYManager {
  private sessions: Map<string, pty.IPty>;
  private outputCallbacks: Map<string, OutputCallback[]>;

  constructor() {
    this.sessions = new Map();
    this.outputCallbacks = new Map();
  }

  async createSession(cols: number = 80, rows: number = 24): Promise<Session> {
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const sessionId = uuidv4();

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols,
      rows,
      cwd: process.cwd(),
      env: process.env as { [key: string]: string }
    });

    this.sessions.set(sessionId, ptyProcess);
    this.outputCallbacks.set(sessionId, []);

    // Set up data handling
    ptyProcess.onData((data) => {
      const callbacks = this.outputCallbacks.get(sessionId) || [];
      callbacks.forEach(callback => callback(data));
    });

    return {
      id: sessionId,
      pid: ptyProcess.pid,
      cols,
      rows
    };
  }

  async attachToSession(sessionId: string): Promise<void> {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} not found`);
    }
  }

  handleOutput(sessionId: string, callback: OutputCallback): void {
    const callbacks = this.outputCallbacks.get(sessionId) || [];
    callbacks.push(callback);
    this.outputCallbacks.set(sessionId, callbacks);
  }

  async sendInput(sessionId: string, data: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    session.write(data);
  }

  async resizeSession(sessionId: string, cols: number, rows: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    session.resize(cols, rows);
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.kill();
      this.sessions.delete(sessionId);
      this.outputCallbacks.delete(sessionId);
    }
  }

  async cleanup(): Promise<void> {
    for (const [sessionId] of this.sessions) {
      await this.closeSession(sessionId);
    }
  }
}
