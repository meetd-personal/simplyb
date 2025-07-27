// Production-ready logging system
// Provides structured logging with different levels and contexts

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  businessId?: string;
  sessionId?: string;
}

class LoggerService {
  private minLevel: LogLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.INFO;
  private userId?: string;
  private businessId?: string;
  private sessionId: string = this.generateSessionId();
  private logBuffer: LogEntry[] = [];
  private maxBufferSize: number = 100;

  constructor() {
    // In production, you might want to send logs to a service periodically
    if (!__DEV__) {
      setInterval(() => this.flushLogs(), 30000); // Flush every 30 seconds
    }
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  setContext(userId?: string, businessId?: string) {
    this.userId = userId;
    this.businessId = businessId;
  }

  setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date(),
      userId: this.userId,
      businessId: this.businessId,
      sessionId: this.sessionId,
    };
  }

  private formatLogMessage(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp.toISOString();
    const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    const userStr = entry.userId ? ` | User: ${entry.userId}` : '';
    const businessStr = entry.businessId ? ` | Business: ${entry.businessId}` : '';
    
    return `[${timestamp}] ${levelName}: ${entry.message}${userStr}${businessStr}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context);
    
    // Add to buffer for potential remote logging
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift(); // Remove oldest entry
    }

    // Console logging
    const formattedMessage = this.formatLogMessage(entry);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage);
        break;
    }

    // In production, send critical logs immediately
    if (!__DEV__ && level >= LogLevel.ERROR) {
      this.sendLogToService(entry);
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context);
  }

  fatal(message: string, context?: Record<string, any>) {
    this.log(LogLevel.FATAL, message, context);
  }

  // Convenience methods for common scenarios
  apiCall(method: string, url: string, status?: number, duration?: number) {
    this.info(`API ${method} ${url}`, { status, duration });
  }

  apiError(method: string, url: string, error: any, status?: number) {
    this.error(`API ${method} ${url} failed`, { error: error.message, status });
  }

  userAction(action: string, details?: Record<string, any>) {
    this.info(`User action: ${action}`, details);
  }

  businessAction(action: string, details?: Record<string, any>) {
    this.info(`Business action: ${action}`, details);
  }

  performance(operation: string, duration: number, details?: Record<string, any>) {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `Performance: ${operation} took ${duration}ms`, details);
  }

  private async sendLogToService(entry: LogEntry) {
    try {
      // In production, send to your logging service
      // Example:
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });
      
      console.log('📊 Log sent to service (simulated)');
    } catch (error) {
      console.error('❌ Failed to send log to service:', error);
    }
  }

  private async flushLogs() {
    if (this.logBuffer.length === 0) return;

    try {
      // Send buffered logs to service
      const logsToSend = [...this.logBuffer];
      this.logBuffer = [];
      
      // In production, batch send logs
      // await this.sendBatchLogsToService(logsToSend);
      
      console.log(`📊 Flushed ${logsToSend.length} logs to service (simulated)`);
    } catch (error) {
      console.error('❌ Failed to flush logs:', error);
    }
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  // Clear logs (useful for testing)
  clearLogs() {
    this.logBuffer = [];
  }
}

// Global logger instance
export const Logger = new LoggerService();

// React Hook for logging
export function useLogger() {
  return {
    debug: Logger.debug.bind(Logger),
    info: Logger.info.bind(Logger),
    warn: Logger.warn.bind(Logger),
    error: Logger.error.bind(Logger),
    fatal: Logger.fatal.bind(Logger),
    apiCall: Logger.apiCall.bind(Logger),
    apiError: Logger.apiError.bind(Logger),
    userAction: Logger.userAction.bind(Logger),
    businessAction: Logger.businessAction.bind(Logger),
    performance: Logger.performance.bind(Logger),
  };
}

export default Logger;
