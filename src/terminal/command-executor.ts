import { ExecutionResult } from './types';

export class CommandExecutor {
  private readonly blockedCommands: Set<string>;
  private readonly resourceLimits: {
    maxExecutionTime: number;  // in milliseconds
    maxOutput: number;        // in bytes
  };

  constructor() {
    this.blockedCommands = new Set([
      'rm -rf /',
      'rm -rf /*',
      '> /dev/sda',
      'mkfs',
      'dd',
      // Add more dangerous commands as needed
    ]);

    this.resourceLimits = {
      maxExecutionTime: 30000, // 30 seconds
      maxOutput: 1024 * 1024  // 1MB
    };
  }

  async validateCommand(command: string): Promise<boolean> {
    // Trim whitespace and normalize
    const normalizedCommand = command.trim().toLowerCase();

    // Check against blocked commands
    if (this.isBlockedCommand(normalizedCommand)) {
      return false;
    }

    // Check for dangerous patterns
    if (this.containsDangerousPatterns(normalizedCommand)) {
      return false;
    }

    // Validate working directory access
    if (this.hasInvalidDirectoryAccess(normalizedCommand)) {
      return false;
    }

    return true;
  }

  private isBlockedCommand(command: string): boolean {
    return Array.from(this.blockedCommands).some(blocked => 
      command.includes(blocked) || command.startsWith(blocked)
    );
  }

  private containsDangerousPatterns(command: string): boolean {
    const dangerousPatterns = [
      /[|;&`$]/,           // Shell metacharacters
      />\s*[^>\s]+/,       // Redirection to files
      /rm\s+(-[rf]+\s+)?/, // Recursive/force remove
      /mkfs/,              // Filesystem operations
      /dd/,                // Direct disk access
      /chmod\s+777/,       // Unsafe permissions
      /sudo/,              // Privilege escalation
    ];

    return dangerousPatterns.some(pattern => pattern.test(command));
  }

  private hasInvalidDirectoryAccess(command: string): boolean {
    const suspiciousPatterns = [
      /\.\./,              // Parent directory access
      /~[^/]*/,           // Home directory shortcuts
      /\/etc\//,          // System configuration
      /\/dev\//,          // Device files
      /\/sys\//,          // System files
      /\/proc\//          // Process information
    ];

    return suspiciousPatterns.some(pattern => pattern.test(command));
  }

  async executeCommand(command: string): Promise<ExecutionResult> {
    try {
      // Validate command first
      const isValid = await this.validateCommand(command);
      if (!isValid) {
        return {
          success: false,
          output: 'Command validation failed: Potentially unsafe operation',
          error: new Error('Command validation failed')
        };
      }

      // Track execution time
      const startTime = Date.now();
      let output = '';
      let error: Error | undefined;

      // TODO: Implement actual command execution with resource tracking
      // This is a placeholder for the actual execution logic
      // In the real implementation, this would:
      // 1. Execute the command in an isolated environment
      // 2. Track resource usage
      // 3. Handle timeouts
      // 4. Capture output with size limits

      const executionTime = Date.now() - startTime;
      if (executionTime > this.resourceLimits.maxExecutionTime) {
        error = new Error('Command execution exceeded time limit');
      }

      return {
        success: !error,
        output: output || 'Command executed successfully',
        error
      };
    } catch (err) {
      return {
        success: false,
        output: 'Command execution failed',
        error: err instanceof Error ? err : new Error('Unknown error occurred')
      };
    }
  }

  handleError(error: Error): void {
    // TODO: Implement error handling strategy
    // This could include:
    // - Logging
    // - Cleanup
    // - Resource recovery
    console.error('Command execution error:', error);
  }

  trackResources(): void {
    // TODO: Implement resource tracking
    // This could track:
    // - CPU usage
    // - Memory usage
    // - File descriptors
    // - Network connections
  }

  setResourceLimit(limit: keyof typeof this.resourceLimits, value: number): void {
    this.resourceLimits[limit] = value;
  }

  addBlockedCommand(command: string): void {
    this.blockedCommands.add(command.toLowerCase().trim());
  }

  removeBlockedCommand(command: string): void {
    this.blockedCommands.delete(command.toLowerCase().trim());
  }

  isCommandBlocked(command: string): boolean {
    return this.isBlockedCommand(command.toLowerCase().trim());
  }
}
