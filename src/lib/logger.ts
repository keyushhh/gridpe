export interface LogContext {
  route?: string;
  componentName?: string;
  [key: string]: unknown;
}

class LoggerService {
  /**
   * Log an error to the centralized service
   * Provider-agnostic to allow easy Sentry/Datadog integration later.
   */
  error(error: Error | unknown, context?: LogContext) {
    const logData = {
      timestamp: new Date().toISOString(),
      error,
      ...context,
    };
    
    // Fallback to console in development
    if (import.meta.env?.DEV) {
      console.error('[Error Logger]', logData);
    } else {
      // Production logging logic goes here
      // e.g., Sentry.captureException(error, { extra: logData });
      console.error('[Production Error Logger]', logData);
    }
  }
  
  warn(message: string, context?: LogContext) {
    const logData = {
      timestamp: new Date().toISOString(),
      ...context,
    };
    console.warn('[Warn Logger]', message, logData);
  }

  info(message: string, context?: LogContext) {
    const logData = {
      timestamp: new Date().toISOString(),
      ...context,
    };
    console.info('[Info Logger]', message, logData);
  }
}

export const logger = new LoggerService();
