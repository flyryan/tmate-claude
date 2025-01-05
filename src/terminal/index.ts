import { PTYManager } from './pty-manager';
import { OutputProcessor } from './output-processor';
import { CommandExecutor } from './command-executor';
import { StateManager } from './state-manager';

export class TerminalIntegration {
  private ptyManager: PTYManager;
  private outputProcessor: OutputProcessor;
  private commandExecutor: CommandExecutor;
  private stateManager: StateManager;

  constructor() {
    this.ptyManager = new PTYManager();
    this.outputProcessor = new OutputProcessor();
    this.commandExecutor = new CommandExecutor();
    this.stateManager = new StateManager();
  }

  async initialize(): Promise<string> {
    try {
      // Create a new terminal session
      const session = await this.ptyManager.createSession();

      // Set up output handling
      this.ptyManager.handleOutput(session.id, (data) => {
        const processedOutput = this.outputProcessor.processRawOutput(data);
        // Update state with new output
        this.stateManager.updateState({
          commandHistory: [processedOutput]
        });
      });

      console.log('Terminal session initialized:', session.id);
      return session.id;
    } catch (error) {
      console.error('Failed to initialize terminal session:', error);
      throw error;
    }
  }

  async executeCommand(sessionId: string, command: string): Promise<void> {
    try {
      // Validate and execute command
      const validationResult = await this.commandExecutor.validateCommand(command);
      if (!validationResult) {
        throw new Error('Command validation failed');
      }

      // Execute command through PTY
      await this.ptyManager.sendInput(sessionId, command + '\n');

      // Update state
      this.stateManager.updateState({
        commandHistory: [command]
      });

    } catch (error) {
      console.error('Command execution failed:', error);
      this.commandExecutor.handleError(error as Error);
      throw error;
    }
  }

  async cleanup(sessionId: string): Promise<void> {
    try {
      await this.ptyManager.closeSession(sessionId);
      this.outputProcessor.clearBuffer();
      this.stateManager.clearHistory();
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  }

  // Utility methods for state access
  getTerminalState() {
    return this.stateManager.getSnapshot();
  }

  getCommandHistory() {
    return this.stateManager.getCommandHistory();
  }

  getCurrentDirectory() {
    return this.stateManager.getCurrentWorkingDirectory();
  }
}

// Example usage
async function main() {
  const terminal = new TerminalIntegration();
  
  try {
    const sessionId = await terminal.initialize();
    console.log('Terminal integration initialized successfully');
    
    // Example commands
    await terminal.executeCommand(sessionId, 'ls');
    await terminal.executeCommand(sessionId, 'pwd');
    
    // Get terminal state
    const state = terminal.getTerminalState();
    console.log('Current terminal state:', state);
    
    // Cleanup
    await terminal.cleanup(sessionId);
    console.log('Terminal cleanup completed');
    
  } catch (error) {
    console.error('Terminal integration test failed:', error);
  }
}

// Only run if this file is being executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default TerminalIntegration;
