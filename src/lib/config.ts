/**
 * Configuration module for gRPC server
 * Handles environment variables and default settings
 */

export interface ServerConfig {
  nodeEnv: string;
  port: string;
  useTLS: boolean;
  certPath?: string;
  keyPath?: string;
  caPath?: string;
  apiKeyExpirationDays: number;
  dateFormat?: string;
  unixFormat?: boolean;
  logLevel?: string;
  logFileEnabled?: boolean;
  logDirectory?: string;
  keepLogsFor?: string;
  storageDateFormat?: string;
}



/**
 * Load server configuration from environment variables
 */
export function loadServerConfig(): ServerConfig {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.GRPC_PORT || '0.0.0.0:50051',
    useTLS: process.env.USE_TLS === 'true',
    certPath: process.env.TLS_CERT_PATH || './server.crt',
    keyPath: process.env.TLS_KEY_PATH || './server.key',
    caPath: process.env.TLS_CA_PATH || './ca.crt',
    apiKeyExpirationDays: parseInt(process.env.API_KEY_EXPIRATION_DAYS || '30', 10),
    dateFormat: process.env.DATE_FORMAT || 'YYYY-MM-DD HH:mm:ss',
    storageDateFormat: process.env.STORAGE_DATE_PATTERNS || 'YYYY-MM',
    unixFormat: process.env.UNIX_FORMAT === 'true',

    logLevel: process.env.LOG_LEVEL || 'info',
    logFileEnabled: process.env.LOG_TO_FILE === 'true',
    logDirectory: process.env.LOG_DIRECTORY || './logs',
    keepLogsFor: process.env.KEEP_LOGS_FOR || '90d',
  };
}
