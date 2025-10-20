#!/usr/bin/env ts-node
/**
 * Utility script to generate service JWT tokens for testing
 * 
 * Usage:
 *   npm run generate:service-token -- --service api-rest-service --role service-admin
 *   npm run generate:service-token -- --help
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import { loadServerConfig } from '../src/lib/config';

interface TokenOptions {
  service: string;
  role: string;
  expiresIn?: string | number;
}

function generateServiceToken(options: TokenOptions): string {
  const config = loadServerConfig();
  const SERVICE_JWT_SECRET = config.serviceJwtSecret;

  const payload = {
    sub: options.service,
    aud: 'grpc_auth',
    role: options.role,
  };

  const signOptions: SignOptions = {
    expiresIn: (options.expiresIn || '1h') as any,
  };

  const token = jwt.sign(payload, SERVICE_JWT_SECRET, signOptions);

  return token;
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: Partial<TokenOptions> = {};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--service':
      options.service = args[++i];
      break;
    case '--role':
      options.role = args[++i];
      break;
    case '--expires':
      options.expiresIn = args[++i];
      break;
    case '--help':
      console.log(`
Service JWT Token Generator
===========================

Usage:
  npm run generate:service-token -- [options]

Options:
  --service <name>    Service name (e.g., api-rest-service)
  --role <role>       Service role (e.g., service-admin)
  --expires <time>    Token expiration time (default: 1h)
  --help              Show this help message

Example:
  npm run generate:service-token -- --service api-rest-service --role service-admin --expires 24h

The generated token can be used in the 'service-authorization' header:
  service-authorization: Bearer <token>
      `);
      process.exit(0);
  }
}

if (!options.service || !options.role) {
  console.error('Error: --service and --role are required');
  console.error('Run with --help for usage information');
  process.exit(1);
}

const token = generateServiceToken(options as TokenOptions);

console.log('\nService JWT Token Generated');
console.log('===========================');
console.log('Service:', options.service);
console.log('Role:', options.role);
console.log('Expires In:', options.expiresIn || '1h');
console.log('\nToken:');
console.log(token);
console.log('\nUse in gRPC metadata:');
console.log(`service-authorization: Bearer ${token}`);
console.log();
