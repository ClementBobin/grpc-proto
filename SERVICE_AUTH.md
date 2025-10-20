# Service Authentication System

This document describes the service-based authentication system for the gRPC server. This system allows services to authenticate with the server using JWT tokens and perform actions based on their assigned permissions.

## Overview

The service authentication system provides:
- **Service JWT authentication** using a separate secret from user authentication
- **Role-based access control** for services
- **Permission-based authorization** for specific endpoints
- **Database-driven configuration** for services, roles, and permissions

## Database Schema

### Tables

#### Roles
Defines roles that can be assigned to services.
```
id: string (PK)
name: string (unique)
created_at: DateTime
updated_at: DateTime
```

#### Permissions
Defines specific permissions for operations.
```
id: string (PK)
name: string (unique)
description: string
created_at: DateTime
updated_at: DateTime
```

#### Services
Represents external services that can authenticate.
```
id: string (PK)
name: string (unique)
role_id: string (FK -> Roles)
created_at: DateTime
updated_at: DateTime
```

#### ServiceRoles
Maps services to roles (many-to-many).
```
service_id: string (FK -> Services)
role_id: string (FK -> Roles)
```

#### RolePermissions
Maps roles to permissions (many-to-many).
```
role_id: string (FK -> Roles)
permission_id: string (FK -> Permissions)
```

#### ServiceEndpoints
Maps service endpoints to required permissions.
```
id: string (PK)
service_name: string
endpoint_name: string
permission_id: string (FK -> Permissions)
created_at: DateTime
updated_at: DateTime
```

## Service JWT Format

Service JWTs must include the following claims:

```typescript
{
  sub: string;    // Service name (e.g., "api-rest-service")
  aud: string;    // Audience - must be "grpc_auth"
  role: string;   // Service role (e.g., "service-admin")
  iat: number;    // Issued at timestamp
  exp: number;    // Expiration timestamp
}
```

## Configuration

Add the following environment variable:

```bash
SERVICE_JWT_SECRET=your-secret-here
```

## Usage

### 1. Generating Service Tokens

Use the provided script to generate service JWT tokens:

```bash
npm run generate:service-token -- --service api-rest-service --role service-admin
```

Options:
- `--service <name>`: Service name (must exist in database)
- `--role <role>`: Service role
- `--expires <time>`: Token expiration (default: 1h)

### 2. Using Service Tokens in gRPC Calls

Include the token in the `service-authorization` metadata header:

```typescript
const metadata = new grpc.Metadata();
metadata.add('service-authorization', `Bearer ${serviceToken}`);

client.getUser({ id: 'user-123' }, metadata, callback);
```

### 3. Applying Service Auth to Endpoints

In your server setup, apply service authentication middleware:

```typescript
import { applyServiceAuthMiddleware } from '@/lib/middleware/serviceAuth.middleware';

// Database-driven endpoint protection (recommended)
// Permissions are automatically fetched from the database based on serviceName
const userServiceWithAuth = await applyServiceAuthMiddleware(userServiceImplementation, {
  level: 'endpoint',
  serviceName: 'UserService',
});

// Or manually specify permissions (legacy approach)
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

// Or role-based global protection
const userServiceWithAuth = await applyServiceAuthMiddleware(userServiceImplementation, {
  level: 'global',
  requiredRole: 'service-admin',
});
```

**Note:** The `applyServiceAuthMiddleware` function is now async and returns a Promise.

### 4. Accessing Service Info in Handlers

The middleware attaches service information to the call object:

```typescript
export const getUser = async (call: grpc.ServerUnaryCall<...>, callback: ...) => {
  // Access service info
  const serviceInfo = (call as any).service;
  console.log('Service:', serviceInfo.serviceName);
  console.log('Role:', serviceInfo.role);
  console.log('Permissions:', serviceInfo.permissions);
  
  // Your handler logic
};
```

## Default Seed Data

The seed script creates:

1. **Role**: `service-admin`
2. **Permissions**:
   - `user:get` - Get user details
   - `user:create` - Create users
   - `user:update` - Update users
   - `user:delete` - Delete users
   - `user:list` - List users
3. **Service**: `api-rest-service` with role `service-admin`
4. **Service Endpoints**: Mappings for UserService endpoints
   - `UserService.getUser` → `user:get`
   - `UserService.createUser` → `user:create`
   - `UserService.updateUser` → `user:update`
   - `UserService.deleteUser` → `user:delete`
   - `UserService.listUsers` → `user:list`
5. **User**: Alice (alice@example.com)

Run the seed:
```bash
npm run prisma:seed
```

## Security Considerations

1. **Separate Secrets**: Service JWT secret is different from user JWT secret
2. **Audience Validation**: All service tokens must have `aud: "grpc_auth"`
3. **Permission Checks**: Each endpoint checks specific permissions in the database
4. **Token Expiration**: Service tokens should have reasonable expiration times

## Example: Creating a New Service

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createService() {
  // Create or get role
  const role = await prisma.role.upsert({
    where: { name: 'service-reader' },
    update: {},
    create: { name: 'service-reader' },
  });

  // Create permission
  const permission = await prisma.permission.create({
    data: {
      name: 'user:read',
      description: 'Read-only access to users',
    },
  });

  // Link role to permission
  await prisma.rolePermission.create({
    data: {
      roleId: role.id,
      permissionId: permission.id,
    },
  });

  // Create service
  const service = await prisma.service.create({
    data: {
      name: 'my-new-service',
      roleId: role.id,
    },
  });

  // Link service to role
  await prisma.serviceRole.create({
    data: {
      serviceId: service.id,
      roleId: role.id,
    },
  });

  // Create endpoint mappings for the service
  await prisma.serviceEndpoint.create({
    data: {
      serviceName: 'UserService',
      endpointName: 'getUser',
      permissionId: permission.id,
    },
  });
}
```

## Testing

The system includes comprehensive tests:

1. **Unit Tests** (`Tests/lib/serviceAuth.middleware.test.ts`):
   - Token validation
   - Role verification
   - Permission checks
   - Middleware wrapping

2. **Integration Tests** (`Tests/integration/serviceAuth.integration.test.ts`):
   - Database interactions
   - End-to-end permission flow
   - Token format validation

Run tests:
```bash
npm test
```

## Middleware Functions

### `requireServiceAuth`
Wraps a single handler with service authentication and optional role check.

```typescript
requireServiceAuth(handler, 'service-admin')
```

### `requireServiceAuthWithPermission`
Wraps a handler with permission-based authentication.

```typescript
requireServiceAuthWithPermission(handler, 'user:get')
```

### `requireServiceAuthGlobal`
Wraps all methods in a service with the same role requirement.

```typescript
requireServiceAuthGlobal(serviceImplementation, 'service-admin')
```

### `requireServiceAuthEndpoint`
Applies different permissions to different endpoints.

```typescript
requireServiceAuthEndpoint(serviceImplementation, {
  getUser: 'user:get',
  createUser: 'user:create',
})
```

### `applyServiceAuthMiddleware`
Flexible wrapper that applies auth based on configuration. **This function is now async.**

```typescript
// Database-driven (recommended)
await applyServiceAuthMiddleware(serviceImplementation, {
  level: 'endpoint',
  serviceName: 'UserService',
})

// Manual permissions (legacy)
await applyServiceAuthMiddleware(serviceImplementation, {
  level: 'endpoint',
  endpointPermissions: { ... },
})
```

## Error Codes

- `UNAUTHENTICATED` (16): Missing or invalid service token
- `PERMISSION_DENIED` (7): Service lacks required role or permission

## Migration from User Auth

The service authentication system is designed to complement, not replace, the existing user authentication. Key differences:

1. **Different Metadata Header**: `service-authorization` vs `authorization`
2. **Different JWT Secret**: `SERVICE_JWT_SECRET` vs `JWT_SECRET`
3. **Different Payload Structure**: Service tokens use `sub`, `aud`, `role`
4. **Database-Driven Permissions**: Service permissions stored in database
5. **Fine-Grained Control**: Per-endpoint permission checks

Both systems can coexist, allowing you to protect endpoints with either user auth or service auth depending on your needs.
