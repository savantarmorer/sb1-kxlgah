import { supabase } from '../lib/supabaseClient.ts.old';

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  metadata?: Record<string, any>;
  errorStack?: string;
}

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  debug(message: string, metadata?: Record<string, any>) {
    Logger.log(LogLevel.DEBUG, this.context, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    Logger.log(LogLevel.INFO, this.context, message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    Logger.log(LogLevel.WARN, this.context, message, metadata);
  }

  error(message: string, metadata?: Record<string, any>, errorStack?: string) {
    Logger.log(LogLevel.ERROR, this.context, message, metadata, errorStack);
  }

  static async log(
    level: LogLevel, 
    context: string, 
    message: string, 
    metadata?: Record<string, any>, 
    errorStack?: string
  ): Promise<void>;
  
  static async log(entry: LogEntry): Promise<void>;
  
  static async log(
    levelOrEntry: LogLevel | LogEntry, 
    context?: string, 
    message?: string, 
    metadata?: Record<string, any>, 
    errorStack?: string
  ): Promise<void> {
    let logEntry: LogEntry;
    const timestamp = new Date().toISOString();
    
    if (typeof levelOrEntry === 'object' && 'level' in levelOrEntry) {
      // If a complete LogEntry is passed
      logEntry = {
        ...levelOrEntry,
        timestamp: levelOrEntry.timestamp || timestamp // Use existing timestamp or create new one
      };
    } else {
      // If individual parameters are passed
      logEntry = {
        timestamp,
        level: levelOrEntry as LogLevel,
        context: context || 'Unknown',
        message: message || '',
        metadata: metadata || {},
        errorStack
      };
    }

    // Console log
    this.consoleLog(logEntry);

    // Database log
    await this.databaseLog(logEntry);

    // Optional: External error tracking (placeholder for Sentry/DataDog)
    // this.externalTracking(logEntry);
  }

  private static consoleLog(entry: LogEntry) {
    const { level, context, message } = entry;
    console[level.toLowerCase() as 'error' | 'warn' | 'info' | 'log'](
      `[${level}] ${context}: ${message}`
    );
  }

  private static async databaseLog(entry: LogEntry) {
    try {
      const { error } = await supabase
        .from('system_logs')
        .insert({
          level: entry.level,
          context: entry.context,
          message: entry.message,
          metadata: JSON.stringify(entry.metadata || {}),
          error_stack: entry.errorStack,
          created_at: entry.timestamp
        });

      if (error) {
        console.error('Failed to log to database:', error);
      }
    } catch (err) {
      console.error('Critical logging failure:', err);
    }
  }
}
