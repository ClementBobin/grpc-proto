# Service Authentication Examples

This file contains practical examples of how to use the service authentication system.

## Example 1: Generating a Service Token

```bash
# Generate a token for api-rest-service with service-admin role
npm run generate:service-token -- --service api-rest-service --role service-admin

# Generate a token with custom expiration (24 hours)
npm run generate:service-token -- --service api-rest-service --role service-admin --expires 24h
```

## Example 2: Using Service Token in gRPC Client

```typescript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import jwt from 'jsonwebtoken';

const SERVICE_JWT_SECRET = 'service-super-secret';

// Generate token
const serviceToken = jwt.sign(
  {
    sub: 'api-rest-service',
    aud: 'grpc_auth',
    role: 'service-admin',
  },
  SERVICE_JWT_SECRET,
  { expiresIn: '1h' }
);

// Load proto and create client
const packageDefinition = protoLoader.loadSync('protos/user.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user;
const client = new userProto.UserService(
  '0.0.0.0:50051',
  grpc.credentials.createInsecure()
);

// Create metadata with service token
const metadata = new grpc.Metadata();
metadata.add('service-authorization', `Bearer ${serviceToken}`);

// Make gRPC call
client.getUser({ id: 'user-id' }, metadata, (err, response) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('User:', response.user);
  }
});
```

## Example 3: Adding Service Auth to Server Endpoints

```typescript
import { applyServiceAuthMiddleware } from '@/lib/middleware/serviceAuth.middleware';

// Database-driven approach (recommended)
// Permissions are automatically fetched from database
const userServiceWithAuth = await applyServiceAuthMiddleware(userServiceImplementation, {
  level: 'endpoint',
  serviceName: 'UserService',
});

// Manual approach (legacy)
const userServiceWithAuth = await applyServiceAuthMiddleware(userServiceImplementation, {
  level: 'endpoint',
  endpointPermissions: {
    getUser: 'user:get',
    createUser: 'user:create',
    updateUser: 'user:update',
    deleteUser: 'user:delete',
    listUsers: 'user:list',
  },
});

// Apply role-based auth to all endpoints
const adminServiceWithAuth = await applyServiceAuthMiddleware(adminServiceImplementation, {
  level: 'global',
  requiredRole: 'service-admin',
});
```

## Example 4: Creating a New Service in Database

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createNewService() {
  // 1. Create a role for the service
  const role = await prisma.role.create({
    data: {
      name: 'service-viewer',
    },
  });

  // 2. Create permissions
  const readPermission = await prisma.permission.create({
    data: {
      name: 'data:read',
      description: 'Read data from the system',
    },
  });

  // 3. Assign permission to role
  await prisma.rolePermission.create({
    data: {
      roleId: role.id,
      permissionId: readPermission.id,
    },
  });

  // 4. Create service
  const service = await prisma.service.create({
    data: {
      name: 'my-new-service',
      roleId: role.id,
    },
  });

  // 5. Link service to role
  await prisma.serviceRole.create({
    data: {
      serviceId: service.id,
      roleId: role.id,
    },
  });

  console.log('Service created:', service);
}

createNewService();
```

## Example 5: Checking Service Permissions Programmatically

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkServicePermissions(serviceName: string) {
  const service = await prisma.service.findUnique({
    where: { name: serviceName },
    include: {
      serviceRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!service) {
    console.log('Service not found');
    return;
  }

  console.log(`Service: ${service.name}`);
  console.log('Roles:');
  service.serviceRoles.forEach((sr) => {
    console.log(`  - ${sr.role.name}`);
    console.log('    Permissions:');
    sr.role.rolePermissions.forEach((rp) => {
      console.log(`      - ${rp.permission.name}: ${rp.permission.description}`);
    });
  });
}

checkServicePermissions('api-rest-service');
```

## Example 6: Testing Service Authentication

```typescript
import { requireServiceAuthWithPermission } from '@/lib/middleware/serviceAuth.middleware';
import * as grpc from '@grpc/grpc-js';

// Test handler
const getUserHandler = async (call: any, callback: any) => {
  console.log('Service info:', call.service);
  // Service info contains:
  // - serviceName: 'api-rest-service'
  // - role: 'service-admin'
  // - permissions: ['user:get', 'user:create', ...]
  
  callback(null, { user: { id: '123', name: 'Alice' } });
};

// Wrap with service auth
const protectedGetUser = requireServiceAuthWithPermission(
  getUserHandler,
  'user:get'
);

// Test with valid token
const mockCall = {
  request: { id: '123' },
  metadata: {
    get: () => [`Bearer ${validServiceToken}`],
  },
};

protectedGetUser(mockCall, (err, response) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Success:', response);
  }
});
```

## Example 7: Multi-Service Setup

```typescript
// Create multiple services with different permissions

async function setupMultipleServices() {
  const prisma = new PrismaClient();

  // Admin service - full access
  const adminRole = await prisma.role.create({
    data: { name: 'service-admin' },
  });

  const allPermissions = await prisma.permission.findMany();
  
  for (const permission of allPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const adminService = await prisma.service.create({
    data: {
      name: 'admin-service',
      roleId: adminRole.id,
    },
  });

  // Read-only service
  const viewerRole = await prisma.role.create({
    data: { name: 'service-viewer' },
  });

  const readPermissions = await prisma.permission.findMany({
    where: {
      name: {
        endsWith: ':get',
      },
    },
  });

  for (const permission of readPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: viewerRole.id,
        permissionId: permission.id,
      },
    });
  }

  const viewerService = await prisma.service.create({
    data: {
      name: 'viewer-service',
      roleId: viewerRole.id,
    },
  });

  console.log('Services created:', [adminService.name, viewerService.name]);
}
```

## Example 8: Error Handling

```typescript
import * as grpc from '@grpc/grpc-js';

// Handle different error cases
client.getUser({ id: 'user-id' }, metadata, (err, response) => {
  if (err) {
    switch (err.code) {
      case grpc.status.UNAUTHENTICATED:
        console.error('Invalid or missing service token');
        break;
      case grpc.status.PERMISSION_DENIED:
        console.error('Service does not have required permission');
        break;
      default:
        console.error('Error:', err.message);
    }
  } else {
    console.log('Success:', response);
  }
});
```

## Example 9: Custom Middleware

```typescript
import { requireServiceAuth } from '@/lib/middleware/serviceAuth.middleware';

// Create custom middleware that combines service auth with custom logic
function customServiceAuth(handler: any) {
  return async (call: any, callback: any) => {
    // First apply service auth
    const authedHandler = requireServiceAuth(handler);
    
    // Add custom logic wrapper
    const customHandler = async (authenticatedCall: any, cb: any) => {
      // Log the service call
      console.log(`Service ${authenticatedCall.service.serviceName} called endpoint`);
      
      // Add custom headers or perform additional checks
      // ...
      
      // Call the original handler
      await handler(authenticatedCall, cb);
    };
    
    await authedHandler(call, callback);
  };
}
```

## Example 10: Running the Seed

```bash
# Initialize database with default data
npm run prisma:seed

# This creates:
# - Role: service-admin
# - Permissions: user:get, user:create, user:update, user:delete, user:list
# - Service: api-rest-service with service-admin role
# - User: Alice (alice@example.com)
```

## Token Verification Example

```typescript
import jwt from 'jsonwebtoken';

const SERVICE_JWT_SECRET = 'service-super-secret';

// Decode and verify token
try {
  const decoded = jwt.verify(token, SERVICE_JWT_SECRET);
  console.log('Service:', decoded.sub);
  console.log('Audience:', decoded.aud);
  console.log('Role:', decoded.role);
} catch (err) {
  console.error('Invalid token:', err.message);
}
```
