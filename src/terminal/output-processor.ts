import { PerformanceMetrics } from './types';

export class OutputProcessor {
  private buffer: string[];
  private maxBufferSize: number;
  private sensitivePatterns: RegExp[];
  private metrics: PerformanceMetrics;
  private lastProcessingTime: number;

  private readonly maxMemoryUsage: number = 50 * 1024 * 1024; // 50MB limit for buffer
  private readonly gcThreshold: number = 0.8; // 80% of max memory

  constructor(maxBufferSize: number = 1000) {
    this.metrics = {
      latency: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      outputSize: 0,
      bufferUtilization: 0
    };
    this.lastProcessingTime = 0;
    this.buffer = [];
    this.maxBufferSize = Math.min(maxBufferSize, Math.floor(this.maxMemoryUsage / 1024)); // Ensure buffer size doesn't exceed memory limit
    this.sensitivePatterns = [
      // Common patterns for sensitive data
      /password[=:]\s*\S+/gi,
      /token[=:]\s*\S+/gi,
      /key[=:]\s*\S+/gi,
      /secret[=:]\s*\S+/gi,
      // Add more patterns as needed
    ];
  }

  processRawOutput(data: Buffer | string): string {
    const startTime = process.hrtime();
    
    const output = data.toString();
    const filtered = this.filterSensitiveData(output);
    this.addToBuffer(filtered);
    
    // Update metrics
    const [seconds, nanoseconds] = process.hrtime(startTime);
    this.metrics.latency = seconds * 1000 + nanoseconds / 1e6; // Convert to milliseconds
    this.metrics.outputSize = filtered.length;
    this.updateResourceMetrics();
    
    return filtered;
  }

  filterSensitiveData(output: string): string {
    let filtered = output;
    this.sensitivePatterns.forEach(pattern => {
      filtered = filtered.replace(pattern, match => {
        // Preserve the identifier (password, token, etc) but mask the value
        const parts = match.split(/[=:]\s*/);
        return `${parts[0]}=[REDACTED]`;
      });
    });
    return filtered;
  }

  addToBuffer(output: string): void {
    // Calculate approximate memory usage of the new output
    const outputSize = Buffer.byteLength(output, 'utf8');
    
    // Check if adding this output would exceed memory limits
    const currentMemoryUsage = this.calculateBufferMemoryUsage();
    if (currentMemoryUsage + outputSize > this.maxMemoryUsage) {
      // Remove older entries until we have enough space
      while (this.buffer.length > 0 && this.calculateBufferMemoryUsage() + outputSize > this.maxMemoryUsage) {
        this.buffer.shift();
      }
    }

    this.buffer.push(output);
    this.maintainBuffer();
    this.updateBufferMetrics();

    // Trigger garbage collection if we're near the threshold
    if (this.metrics.memoryUsage > this.maxMemoryUsage * this.gcThreshold) {
      setImmediate(() => {
        this.buffer = [...this.buffer]; // Force array compaction
        if (global.gc) {
          global.gc(); // Suggest garbage collection if available
        }
      });
    }
  }

  maintainBuffer(): void {
    while (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
  }

  getFormattedOutput(): string {
    return this.buffer.join('');
  }

  getBufferContents(): string[] {
    return [...this.buffer];
  }

  clearBuffer(): void {
    this.buffer = [];
  }

  setMaxBufferSize(size: number): void {
    this.maxBufferSize = size;
    this.maintainBuffer();
  }

  addSensitivePattern(pattern: RegExp): void {
    this.sensitivePatterns.push(pattern);
  }

  removeSensitivePattern(pattern: RegExp): void {
    this.sensitivePatterns = this.sensitivePatterns.filter(
      p => p.toString() !== pattern.toString()
    );
  }

  private calculateBufferMemoryUsage(): number {
    return this.buffer.reduce((total, item) => 
      total + Buffer.byteLength(item, 'utf8'), 0);
  }

  private updateResourceMetrics(): void {
    const memoryUsage = process.memoryUsage();
    this.metrics.memoryUsage = this.calculateBufferMemoryUsage();
    
    // Calculate CPU usage based on processing time difference
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastProcessingTime;
    if (timeDiff > 0) {
      // Use exponential moving average for smoother CPU usage
      const newCpuUsage = Math.min((this.metrics.latency / timeDiff) * 100, 100);
      this.metrics.cpuUsage = this.metrics.cpuUsage * 0.7 + newCpuUsage * 0.3;
    }
    this.lastProcessingTime = currentTime;
  }

  private updateBufferMetrics(): void {
    this.metrics.bufferUtilization = (this.buffer.length / this.maxBufferSize) * 100;
  }

  getBufferSize(): number {
    return this.buffer.length;
  }

  getMaxBufferSize(): number {
    return this.maxBufferSize;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      latency: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      outputSize: 0,
      bufferUtilization: 0
    };
  }
}
