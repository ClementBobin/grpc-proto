#!/usr/bin/env ts-node
/**
 * Example client demonstrating service authentication
 * 
 * This script shows how to:
 * 1. Generate a service JWT token
 * 2. Make a gRPC call with service authentication
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import jwt from 'jsonwebtoken';
import path from 'path';

const SERVICE_JWT_SECRET = process.env.SERVICE_JWT_SECRET || 'service-super-secret';
const GRPC_PORT = process.env.GRPC_PORT || '0.0.0.0:50051';

// Generate a service token
function generateServiceToken(serviceName: string, role: string): string {
  return jwt.sign(
    {
      sub: serviceName,
      aud: 'grpc_auth',
      role: role,
    },
    SERVICE_JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function main() {
  console.log('Service Auth Example Client');
  console.log('===========================\n');

  // Generate token for api-rest-service
  const serviceToken = generateServiceToken('api-rest-service', 'service-admin');
  console.log('Generated service token for: api-rest-service');
  console.log('Token:', serviceToken.substring(0, 50) + '...\n');

  // Load proto file
  const PROTO_PATH = path.join(__dirname, '../protos/user.proto');
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const userProto = grpc.loadPackageDefinition(packageDefinition).user as any;

  // Create client
  const client = new userProto.UserService(
    GRPC_PORT,
    grpc.credentials.createInsecure()
  );

  // Example 1: Valid service token calling GetUser
  console.log('Example 1: Valid service token calling ListUsers');
  console.log('------------------------------------------------');
  
  const metadata = new grpc.Metadata();
  metadata.add('service-authorization', `Bearer ${serviceToken}`);

  client.listUsers({ page: 1, pageSize: 10 }, metadata, (err: any, response: any) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('Success! Users:', response.users);
    }
    
    // Example 2: Invalid token (user token instead of service token)
    console.log('\nExample 2: Invalid token (wrong secret)');
    console.log('---------------------------------------');
    
    const invalidToken = jwt.sign(
      { userId: '123', role: 'admin' },
      'wrong-secret'
    );
    
    const invalidMetadata = new grpc.Metadata();
    invalidMetadata.add('service-authorization', `Bearer ${invalidToken}`);
    
    client.listUsers({ page: 1, pageSize: 10 }, invalidMetadata, (err2: any, response2: any) => {
      if (err2) {
        console.error('Expected error:', err2.message);
        console.log('Code:', err2.code, '(UNAUTHENTICATED)');
      } else {
        console.log('Unexpected success:', response2);
      }
      
      // Example 3: Missing token
      console.log('\nExample 3: Missing service token');
      console.log('--------------------------------');
      
      client.listUsers({ page: 1, pageSize: 10 }, (err3: any, response3: any) => {
        if (err3) {
          console.error('Expected error:', err3.message);
          console.log('Code:', err3.code, '(UNAUTHENTICATED)');
        } else {
          console.log('Unexpected success:', response3);
        }
        
        console.log('\nDone!');
        process.exit(0);
      });
    });
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
