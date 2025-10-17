import * as fs from 'fs';
import * as grpc from '@grpc/grpc-js';

/**
 * Create SSL credentials for gRPC server
 * @param certPath Path to server certificate
 * @param keyPath Path to server private key
 * @param caPath Optional path to CA certificate
 * @returns ServerCredentials for TLS
 */
export function createTLSCredentials(
  certPath: string,
  keyPath: string,
  caPath?: string
): grpc.ServerCredentials {
  try {
    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    const ca = caPath && fs.existsSync(caPath) ? fs.readFileSync(caPath) : null;

    return grpc.ServerCredentials.createSsl(
      ca,
      [{
        cert_chain: cert,
        private_key: key
      }],
      true
    );
  } catch (error) {
    console.error('Failed to load TLS credentials:', error);
    throw new Error('TLS credentials could not be loaded. Ensure cert files exist and are readable.');
  }
}

// Legacy export for backward compatibility
const creds = grpc.ServerCredentials.createSsl(
  fs.existsSync('ca.crt') ? fs.readFileSync('ca.crt') : null,
  [{
    cert_chain: fs.existsSync('server.crt') ? fs.readFileSync('server.crt') : Buffer.from(''),
    private_key: fs.existsSync('server.key') ? fs.readFileSync('server.key') : Buffer.from('')
  }],
  true
);

export default creds;