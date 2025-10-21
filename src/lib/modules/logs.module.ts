/**
 * Logs module - provides logging functionality for gRPC server
 * This is a simplified interface that can be easily mocked for testing
 */

export interface LogsModule {
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: any): void;
}

/**
 * Simple logger implementation for production use
 */
class SimpleLogger implements LogsModule {
  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  warn(message: string): void {
    console.warn(`[WARN] ${message}`);
  }

  error(message: string, error?: any): void {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}:`, error.message);
    } else if (error) {
      console.error(`[ERROR] ${message}:`, error);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }
}

// Export a singleton instance
const logger = new SimpleLogger();
export default logger;
