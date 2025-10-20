#!/usr/bin/env ts-node
/**
 * Utility script to generate API keys for service authentication
 * 
 * Usage:
 *   npm run generate:api-key -- --service api-rest-service --days 30
 *   npm run generate:api-key -- --help
 */

import { PrismaClient } from '@prisma/client';
import { createApiKey } from '../src/lib/middleware/serviceAuth.middleware';
import { loadServerConfig } from '../src/lib/config';

interface ApiKeyOptions {
  service: string;
  days?: number;
}

async function main() {
  const prisma = new PrismaClient();
  const config = loadServerConfig();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: Partial<ApiKeyOptions> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--service':
        options.service = args[++i];
        break;
      case '--days':
        options.days = parseInt(args[++i], 10);
        break;
      case '--help':
        console.log(`
API Key Generator
=================

Usage:
  npm run generate:api-key -- [options]

Options:
  --service <name>    Service name (e.g., api-rest-service)
  --days <number>     Days until expiration (default: ${config.apiKeyExpirationDays})
  --help              Show this help message

Example:
  npm run generate:api-key -- --service api-rest-service --days 30

The generated API key can be used in the 'service-authorization' header:
  service-authorization: Bearer <api-key>
        `);
        await prisma.$disconnect();
        process.exit(0);
    }
  }

  if (!options.service) {
    console.error('Error: --service is required');
    console.error('Run with --help for usage information');
    await prisma.$disconnect();
    process.exit(1);
  }

  try {
    const { key, expiresAt } = await createApiKey(
      options.service,
      options.days
    );

    console.log('\nAPI Key Generated');
    console.log('=================');
    console.log('Service:', options.service);
    console.log('Expires At:', expiresAt.toISOString());
    console.log('Days Until Expiration:', options.days || config.apiKeyExpirationDays);
    console.log('\nAPI Key:');
    console.log(key);
    console.log('\nUse in gRPC metadata:');
    console.log(`service-authorization: Bearer ${key}`);
    console.log('\nNote: API keys automatically expire and must be renewed.');
    console.log('Store this key securely - it cannot be retrieved again.');
    console.log();
  } catch (error: any) {
    console.error('\nError generating API key:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
