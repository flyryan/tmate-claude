export class OutputProcessor {
  private buffer: string[];
  private maxBufferSize: number;
  private sensitivePatterns: RegExp[];

  constructor(maxBufferSize: number = 1000) {
    this.buffer = [];
    this.maxBufferSize = maxBufferSize;
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
    const output = data.toString();
    const filtered = this.filterSensitiveData(output);
    this.addToBuffer(filtered);
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
    this.buffer.push(output);
    this.maintainBuffer();
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

  getBufferSize(): number {
    return this.buffer.length;
  }

  getMaxBufferSize(): number {
    return this.maxBufferSize;
  }
}
