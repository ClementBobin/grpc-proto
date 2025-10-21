/**
 * Configuration module for gRPC server
 * Handles environment variables and default settings
 */

export interface ServerConfig {
  port: string;
  useTLS: boolean;
  certPath?: string;
  keyPath?: string;
  caPath?: string;
  apiKeyExpirationDays: number;
}

export interface ServiceAuthConfig {
  enabled: boolean;
  allowedRoles?: string[];
}

export interface EndpointAuthConfig {
  [endpoint: string]: {
    enabled: boolean;
    allowedRoles?: string[];
  };
}

/**
 * Load server configuration from environment variables
 */
export function loadServerConfig(): ServerConfig {
  return {
    port: process.env.GRPC_PORT || '0.0.0.0:50051',
    useTLS: process.env.USE_TLS === 'true',
    certPath: process.env.TLS_CERT_PATH || './server.crt',
    keyPath: process.env.TLS_KEY_PATH || './server.key',
    caPath: process.env.TLS_CA_PATH || './ca.crt',
    apiKeyExpirationDays: parseInt(process.env.API_KEY_EXPIRATION_DAYS || '30', 10),
  };
}
