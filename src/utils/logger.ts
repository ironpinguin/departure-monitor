/**
 * Structured logging system for the departure monitor application
 * Provides different log levels and structured log entries with context
 */

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsoleOutput: boolean;
  enableStructuredOutput: boolean;
  enableTimestamp: boolean;
  enableStackTrace: boolean;
}

/**
 * Default logger configuration
 * Can be overridden by environment variables or configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
  enableConsoleOutput: true,
  enableStructuredOutput: process.env.NODE_ENV === 'development',
  enableTimestamp: true,
  enableStackTrace: process.env.NODE_ENV === 'development'
};

/**
 * Logger class providing structured logging capabilities
 */
class Logger {
  private config: LoggerConfig;
  private context: string;

  constructor(context: string = 'App', config: Partial<LoggerConfig> = {}) {
    this.context = context;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a new logger instance with a specific context
   */
  createChild(context: string): Logger {
    return new Logger(`${this.context}:${context}`, this.config);
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if a log level should be processed
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const getLevelName = (level: LogLevel): string => {
      switch (level) {
        case LogLevel.DEBUG: return 'DEBUG';
        case LogLevel.INFO: return 'INFO';
        case LogLevel.WARN: return 'WARN';
        case LogLevel.ERROR: return 'ERROR';
        case LogLevel.CRITICAL: return 'CRITICAL';
        default: return 'UNKNOWN';
      }
    };

    const entry: LogEntry = {
      timestamp: this.config.enableTimestamp ? new Date().toISOString() : '',
      level,
      levelName: getLevelName(level),
      message,
      context: this.context
    };

    if (data && Object.keys(data).length > 0) {
      entry.data = data;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.config.enableStackTrace ? error.stack : undefined
      };
    }

    return entry;
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    if (!this.config.enableConsoleOutput) return;

    const prefix = `[${entry.timestamp}] [${entry.levelName}] [${entry.context}]`;
    const message = `${prefix} ${entry.message}`;

    // Choose appropriate console method based on log level
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data, entry.error);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data, entry.error);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data, entry.error);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message, entry.data, entry.error);
        break;
    }
  }

  /**
   * Output structured log entry
   */
  private outputStructured(entry: LogEntry): void {
    if (!this.config.enableStructuredOutput) return;
    
    // In development, output structured JSON for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('STRUCTURED_LOG:', JSON.stringify(entry, null, 2));
    }
  }

  /**
   * Internal log method that handles the actual logging
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, data, error);
    
    this.outputToConsole(entry);
    this.outputStructured(entry);
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log error message
   */
  error(message: string, data?: Record<string, unknown>, error?: Error): void {
    this.log(LogLevel.ERROR, message, data, error);
  }

  /**
   * Log critical error message
   */
  critical(message: string, data?: Record<string, unknown>, error?: Error): void {
    this.log(LogLevel.CRITICAL, message, data, error);
  }
}

/**
 * Default application logger instance
 */
export const logger = new Logger('DepartureMonitor');

/**
 * Create a logger for a specific context
 */
export const createLogger = (context: string): Logger => {
  return new Logger(context);
};

/**
 * Logger instances for specific modules
 */
export const loggers = {
  configStore: createLogger('ConfigStore'),
  importExport: createLogger('ImportExport'),
  validation: createLogger('Validation'),
  api: createLogger('API'),
  components: createLogger('Components'),
  utils: createLogger('Utils')
};

/**
 * Helper function to configure global logging
 */
export const configureLogging = (config: Partial<LoggerConfig>): void => {
  logger.configure(config);
  Object.values(loggers).forEach(log => log.configure(config));
};

/**
 * Helper function to extract error information for logging
 */
export const extractErrorInfo = (error: unknown): { message: string; data?: Record<string, unknown> } => {
  if (error instanceof Error) {
    return {
      message: error.message,
      data: {
        name: error.name,
        stack: error.stack
      }
    };
  }
  
  if (typeof error === 'string') {
    return { message: error };
  }
  
  return {
    message: 'Unknown error occurred',
    data: { error: String(error) }
  };
};