/**
 * Example: Using API Key Authentication
 * 
 * This example demonstrates how to use API key authentication instead of JWT tokens
 * for service-to-service authentication in gRPC.
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { createApiKey } from '../src/lib/middleware/serviceAuth.middleware';

const PROTO_PATH = path.join(__dirname, '../protos/user.proto');

async function main() {
  const prisma = new PrismaClient();

  console.log('API Key Authentication Example');
  console.log('================================\n');

  // Step 1: Generate an API key for the service
  console.log('Step 1: Generating API key for api-rest-service...');
  const { key, expiresAt } = await createApiKey('api-rest-service', 30);
  console.log('✓ API Key generated successfully');
  console.log(`  Key: ${key}`);
  console.log(`  Expires: ${expiresAt.toISOString()}\n`);

  // Step 2: Load the proto file
  console.log('Step 2: Loading proto definitions...');
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const userProto = grpc.loadPackageDefinition(packageDefinition) as any;
  console.log('✓ Proto loaded\n');

  // Step 3: Create a client
  console.log('Step 3: Creating gRPC client...');
  const client = new userProto.user.UserService(
    '0.0.0.0:50051',
    grpc.credentials.createInsecure()
  );
  console.log('✓ Client created\n');

  // Step 4: Make a request using the API key
  console.log('Step 4: Making authenticated request with API key...');
  const metadata = new grpc.Metadata();
  metadata.add('service-authorization', `Bearer ${key}`);

  client.GetUser(
    { id: 'test-user-id' },
    metadata,
    (err: any, response: any) => {
      if (err) {
        console.log('✗ Request failed (expected if server is not running)');
        console.log(`  Error: ${err.message}\n`);
      } else {
        console.log('✓ Request successful!');
        console.log(`  Response: ${JSON.stringify(response, null, 2)}\n`);
      }

      console.log('Example completed.');
      console.log('\nKey takeaways:');
      console.log('1. API keys are automatically generated with configurable expiration');
      console.log('2. API keys are validated on each request for expiration and revocation');
      console.log('3. Last used timestamp is tracked for monitoring');
      console.log('4. Both JWT and API keys are supported for backward compatibility');
      console.log('5. API keys are more secure as they can be individually revoked\n');

      prisma.$disconnect();
    }
  );
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
