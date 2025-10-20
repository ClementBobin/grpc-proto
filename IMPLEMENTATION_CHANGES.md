# Implementation Changes: Database-Driven Endpoint Permissions

## Overview

This implementation replaces the hardcoded endpoint permissions approach with a database-driven system that automatically fetches permissions based on the service name.

## Problem Statement

Previously, endpoint permissions had to be defined in code every time a service was registered:

```typescript
const userServiceWithAuth = applyServiceAuthMiddleware(userServiceImplementation, {
  level: 'endpoint',
  endpointPermissions: {
    getUser: 'user:get',
    createUser: 'user:create',
    updateUser: 'user:update',
    deleteUser: 'user:delete',
    listUsers: 'user:list',
  },
});
```

This approach had several drawbacks:
- Permissions were duplicated across code and database
- Changes required code modifications and redeployment
- No single source of truth for permissions
- Difficult to manage at scale

## Solution

### 1. Database Schema Extension

Added a new `ServiceEndpoint` model to store endpoint-to-permission mappings:

```prisma
model ServiceEndpoint {
  id           String   @id @default(cuid())
  serviceName  String   @map("service_name")
  endpointName String   @map("endpoint_name")
  permissionId String   @map("permission_id")
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@unique([serviceName, endpointName])
  @@map("service_endpoints")
}
```

### 2. Middleware Enhancement

Enhanced `applyServiceAuthMiddleware` to:
- Accept a `serviceName` parameter
- Automatically fetch permissions from the database
- Remain backward compatible with manual permissions

```typescript
export async function applyServiceAuthMiddleware<T>(
  serviceImplementation: T,
  options?: {
    level?: 'global' | 'endpoint';
    requiredRole?: string;
    endpointPermissions?: { [endpoint: string]: string };
    serviceName?: string; // New parameter
  }
): Promise<T> {
  // ... implementation
}
```

### 3. Database Query Function

Added `getServiceEndpointPermissions` to fetch permissions:

```typescript
async function getServiceEndpointPermissions(serviceName: string): Promise<{ [endpoint: string]: string }> {
  const endpoints = await prisma.serviceEndpoint.findMany({
    where: { serviceName },
    include: { permission: true },
  });

  const permissions: { [endpoint: string]: string } = {};
  for (const endpoint of endpoints) {
    permissions[endpoint.endpointName] = endpoint.permission.name;
  }

  return permissions;
}
```

### 4. Server Configuration Simplification

Updated `server.ts` to use the new approach:

```typescript
// Old approach
const userServiceWithAuth = applyServiceAuthMiddleware(userServiceImplementation, {
  level: 'endpoint',
  endpointPermissions: {
    getUser: 'user:get',
    // ... 4 more endpoints
  },
});

// New approach
const userServiceWithAuth = await applyServiceAuthMiddleware(userServiceImplementation, {
  level: 'endpoint',
  serviceName: 'UserService',
});
```

### 5. Seed Data Update

Extended `prisma/seed.ts` to populate endpoint permissions:

```typescript
const userServiceEndpoints = [
  { endpointName: 'getUser', permissionId: getUserPermission.id },
  { endpointName: 'createUser', permissionId: createUserPermission.id },
  { endpointName: 'updateUser', permissionId: updateUserPermission.id },
  { endpointName: 'deleteUser', permissionId: deleteUserPermission.id },
  { endpointName: 'listUsers', permissionId: listUsersPermission.id },
];

for (const endpoint of userServiceEndpoints) {
  await prisma.serviceEndpoint.upsert({
    where: {
      serviceName_endpointName: {
        serviceName: 'UserService',
        endpointName: endpoint.endpointName,
      },
    },
    update: {},
    create: {
      serviceName: 'UserService',
      endpointName: endpoint.endpointName,
      permissionId: endpoint.permissionId,
    },
  });
}
```

## Benefits

### 1. Single Source of Truth
All permissions are now in the database, eliminating duplication between code and data.

### 2. Dynamic Configuration
Permissions can be updated via database operations without code changes:

```typescript
await prisma.serviceEndpoint.update({
  where: {
    serviceName_endpointName: {
      serviceName: 'UserService',
      endpointName: 'getUser',
    },
  },
  data: {
    permissionId: newPermissionId,
  },
});
```

### 3. Scalability
Adding new endpoints or services is straightforward:

```typescript
await prisma.serviceEndpoint.create({
  data: {
    serviceName: 'UserService',
    endpointName: 'archiveUser',
    permissionId: archivePermissionId,
  },
});
```

### 4. Centralized Management
All permission configurations can be viewed and managed from a single location (database).

### 5. Auditability
Database provides built-in support for tracking permission changes via `created_at` and `updated_at`.

## Implementation Details

### File Changes

1. **prisma/schema.prisma**
   - Added `ServiceEndpoint` model
   - Added relation to `Permission` model

2. **src/lib/middleware/serviceAuth.middleware.ts**
   - Added `getServiceEndpointPermissions` function
   - Modified `applyServiceAuthMiddleware` to be async
   - Added logic to fetch permissions from database

3. **src/server.ts**
   - Made `main()` async
   - Simplified service auth configuration
   - Added `await` before `applyServiceAuthMiddleware`

4. **prisma/seed.ts**
   - Added endpoint permission seeding

5. **Tests/lib/serviceAuth.middleware.test.ts**
   - Added `await` to async calls
   - Added new test for database-driven permissions
   - Updated mock to include `serviceEndpoint`

### Migration Created

```sql
-- CreateTable
CREATE TABLE "service_endpoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service_name" TEXT NOT NULL,
    "endpoint_name" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "service_endpoints_permission_id_fkey" 
      FOREIGN KEY ("permission_id") 
      REFERENCES "permissions" ("id") 
      ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "service_endpoints_service_name_endpoint_name_key" 
  ON "service_endpoints"("service_name", "endpoint_name");
```

## Backward Compatibility

The old approach still works for backward compatibility:

```typescript
const wrapped = await applyServiceAuthMiddleware(implementation, {
  level: 'endpoint',
  endpointPermissions: {
    getUser: 'user:get',
    // ...
  },
});
```

## Testing

All existing tests continue to pass (65 tests), plus a new test was added to verify database-driven permission loading.

Test coverage includes:
- Token validation
- Role verification
- Permission checks
- Database-driven permission fetching
- Async middleware behavior

## Performance Considerations

The database query is executed once during service initialization (server startup), not on every request. This means:
- No performance impact on request handling
- Permissions are cached in memory after loading
- Minimal overhead during server startup

## Future Enhancements

Potential future improvements:
1. Permission caching with TTL
2. Runtime permission reload without restart
3. Web UI for permission management
4. Permission versioning and rollback
5. Bulk permission updates via admin API

## Documentation Updates

Updated the following documentation files:
- `SERVICE_AUTH.md` - Main documentation
- `QUICKSTART_SERVICE_AUTH.md` - Quick start guide
- `EXAMPLES_SERVICE_AUTH.md` - Examples
- `IMPLEMENTATION_SUMMARY.md` - Implementation overview
- `MIGRATION_GUIDE.md` - Migration instructions (new)
- `IMPLEMENTATION_CHANGES.md` - This file (new)

## Conclusion

This implementation successfully achieves the goal of database-driven endpoint permissions while maintaining backward compatibility and improving the developer experience. The system is now more flexible, maintainable, and scalable.
