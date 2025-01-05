import { Worker } from 'worker_threads';
import { ExecutionResult, ResourceLimits, ResourceUsage, SecurityEvent } from './types';
import * as os from 'os';

export class CommandExecutor {
  private readonly blockedCommands: Set<string>;
  private readonly resourceLimits: ResourceLimits;
  private currentUsage: ResourceUsage;
  private securityEvents: SecurityEvent[];
  private workers: Map<number, Worker>;
  private cpuThrottleTimer: NodeJS.Timeout | null;
  private readonly maxConcurrentWorkers = 1; // Further reduced to minimize CPU impact
  private readonly workerCooldown = 300; // Increased cooldown period
  private readonly cpuThrottleThreshold = 70; // Lower threshold for earlier throttling
  private readonly maxWorkerLifetime = 5000; // Maximum worker lifetime in ms

  constructor() {
    this.workers = new Map();
    this.cpuThrottleTimer = null;
    this.blockedCommands = new Set([
      'rm -rf /',
      'rm -rf /*',
      '> /dev/sda',
      'mkfs',
      'dd',
      // Add more dangerous commands as needed
    ]);

    this.resourceLimits = {
      maxExecutionTime: 30000,           // 30 seconds
      maxOutput: 1024 * 1024,           // 1MB
      maxCpuUsage: 80,                  // 80%
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB
      maxFileDescriptors: 100,          // 100 file descriptors
      maxNetworkConnections: 10         // 10 concurrent connections
    };

    this.currentUsage = {
      cpuUsage: 0,
      memoryUsage: 0,
      fileDescriptors: 0,
      networkConnections: 0
    };

    this.securityEvents = [];
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
      /export\s+\w+=/,     // Environment variable modification
      /env\s+-/,           // Environment manipulation
      /source/,            // Shell script sourcing
      /eval/,              // Command evaluation
      /exec\s/,            // Process replacement
      /kill/,              // Process termination
      /pkill/,            // Process killing
      /killall/,          // Process killing
      /renice/,           // Process priority modification
      /nohup/,            // Process detachment
      /nice/              // Process priority modification
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
      const isValid = await this.validateCommand(command);
      if (!isValid) {
        this.logSecurityEvent('command_blocked', 'high', { command, reason: 'Command validation failed' });
        return {
          success: false,
          output: 'Command validation failed: Potentially unsafe operation',
          error: new Error('Command validation failed')
        };
      }

      // Check resource availability before execution
      if (!this.checkResourceAvailability()) {
        this.logSecurityEvent('resource_exceeded', 'high', {
          reason: 'Resource limits exceeded before execution',
          actual: this.currentUsage.cpuUsage,
          limit: this.resourceLimits.maxCpuUsage
        });
        return {
          success: false,
          output: 'Resource limits exceeded',
          error: new Error('Resource limits exceeded')
        };
      }

      const startTime = Date.now();
      // Check if we're at the worker limit
      if (this.workers.size >= this.maxConcurrentWorkers) {
        this.logSecurityEvent('resource_exceeded', 'medium', {
          reason: 'Maximum concurrent workers reached',
          actual: this.workers.size,
          limit: this.maxConcurrentWorkers
        });
        return {
          success: false,
          output: 'Too many concurrent commands',
          error: new Error('Maximum concurrent workers reached')
        };
      }

      const worker = new Worker(`
        const { parentPort } = require('worker_threads');
        const { exec } = require('child_process');
        
        // Sanitize environment
        const cleanEnv = {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          TERM: process.env.TERM
        };

        // Set resource limits
        process.resourceUsage = {
          maxOldGenerationSizeMb: 50,
          maxYoungGenerationSizeMb: 50,
          maxHeapSizeMb: 100
        };

        parentPort.on('message', (command) => {
          exec(command, { 
            env: cleanEnv,
            cwd: process.cwd(),
            timeout: 30000, // 30 second timeout
            maxBuffer: 1024 * 1024, // 1MB output limit
            windowsHide: true, // Hide subprocess window on Windows
            killSignal: 'SIGTERM' // Use SIGTERM for cleaner termination
          }, (error, stdout, stderr) => {
            parentPort.postMessage({ error, stdout, stderr });
          });
        });

        // Auto-terminate after maxWorkerLifetime
        setTimeout(() => process.exit(0), ${this.maxWorkerLifetime});
      `, { eval: true });

      const result = await new Promise<ExecutionResult>((resolve) => {
        const workerId = Date.now();
        this.workers.set(workerId, worker);

        const timeout = setTimeout(() => {
          worker.terminate();
          this.workers.delete(workerId);
          this.logSecurityEvent('resource_exceeded', 'medium', {
            command,
            reason: 'Execution timeout',
            limit: this.resourceLimits.maxExecutionTime
          });
          resolve({
            success: false,
            output: 'Command execution timed out',
            error: new Error('Execution timeout')
          });
        }, this.resourceLimits.maxExecutionTime);

        worker.on('message', (result: { error: Error, stdout: string, stderr: string }) => {
          clearTimeout(timeout);
          this.workers.delete(workerId);
          
          const output = result.stdout + result.stderr;
          if (output.length > this.resourceLimits.maxOutput) {
            this.logSecurityEvent('resource_exceeded', 'low', {
              command,
              reason: 'Output size exceeded',
              actual: output.length,
              limit: this.resourceLimits.maxOutput
            });
          }

          resolve({
            success: !result.error,
            output: output.slice(0, this.resourceLimits.maxOutput),
            error: result.error
          });
        });

        worker.postMessage(command);
      });

      await this.updateResourceUsage();
      return result;
    } catch (err) {
      return {
        success: false,
        output: 'Command execution failed',
        error: err instanceof Error ? err : new Error('Unknown error occurred')
      };
    }
  }

  private async updateResourceUsage(): Promise<void> {
    // Update CPU usage with throttling
    const cpus = os.cpus();
    const totalCpu = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      return acc + (100 - (cpu.times.idle / total * 100));
    }, 0) / cpus.length;
    
    // Use exponential moving average for smoother CPU tracking
    this.currentUsage.cpuUsage = this.currentUsage.cpuUsage * 0.7 + totalCpu * 0.3;

    // Implement proactive CPU throttling
    if (this.currentUsage.cpuUsage > this.cpuThrottleThreshold) {
      if (!this.cpuThrottleTimer) {
        // More aggressive exponential backoff
        const dynamicCooldown = this.workerCooldown * 
          Math.pow(3, (this.currentUsage.cpuUsage - this.cpuThrottleThreshold) / 10);
        
        this.cpuThrottleTimer = setTimeout(() => {
          this.cpuThrottleTimer = null;
        }, dynamicCooldown);
        
        this.logSecurityEvent('resource_exceeded', 'medium', {
          resource: 'CPU',
          actual: this.currentUsage.cpuUsage,
          limit: this.resourceLimits.maxCpuUsage
        });
      }
    }

    // Update memory usage
    const memUsage = process.memoryUsage();
    this.currentUsage.memoryUsage = memUsage.heapUsed;

    // Update file descriptors (approximate using process.getActiveResourcesInfo() when available)
    this.currentUsage.fileDescriptors = this.workers.size * 2; // Rough estimate

    // Update network connections (approximate based on active workers)
    this.currentUsage.networkConnections = this.workers.size;

    // Check for resource limits
    if (this.currentUsage.cpuUsage > this.resourceLimits.maxCpuUsage) {
      this.logSecurityEvent('resource_exceeded', 'high', {
        resource: 'CPU',
        actual: this.currentUsage.cpuUsage,
        limit: this.resourceLimits.maxCpuUsage
      });
    }

    if (this.currentUsage.memoryUsage > this.resourceLimits.maxMemoryUsage) {
      this.logSecurityEvent('resource_exceeded', 'high', {
        resource: 'Memory',
        actual: this.currentUsage.memoryUsage,
        limit: this.resourceLimits.maxMemoryUsage
      });
    }
  }

  private checkResourceAvailability(): boolean {
    return (
      this.currentUsage.cpuUsage < this.resourceLimits.maxCpuUsage &&
      this.currentUsage.memoryUsage < this.resourceLimits.maxMemoryUsage &&
      this.currentUsage.fileDescriptors < this.resourceLimits.maxFileDescriptors &&
      this.currentUsage.networkConnections < this.resourceLimits.maxNetworkConnections
    );
  }

  private logSecurityEvent(
    type: SecurityEvent['type'],
    severity: SecurityEvent['severity'],
    details: SecurityEvent['details']
  ): void {
    const event: SecurityEvent = {
      type,
      timestamp: Date.now(),
      details,
      severity
    };
    this.securityEvents.push(event);
    console.error('Security Event:', event);
  }

  getResourceUsage(): ResourceUsage {
    return { ...this.currentUsage };
  }

  getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  handleError(error: Error): void {
    this.logSecurityEvent('command_blocked', 'medium', {
      reason: error.message
    });
    console.error('Command execution error:', error);
  }

  clearSecurityEvents(): void {
    this.securityEvents = [];
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
