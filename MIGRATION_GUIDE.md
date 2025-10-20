# Migration Guide: Database-Driven Endpoint Permissions

## Overview

This update changes how endpoint permissions are configured in the service authentication system. Instead of hardcoding permissions in the code, they are now stored in the database and automatically loaded.

## What Changed

### Before (Hardcoded Approach)
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

### After (Database-Driven Approach)
```typescript
const userServiceWithAuth = await applyServiceAuthMiddleware(userServiceImplementation, {
  level: 'endpoint',
  serviceName: 'UserService',
});
```

## Key Changes

### 1. New Database Table: `ServiceEndpoint`

A new table stores the mapping between service endpoints and required permissions:

```sql
CREATE TABLE service_endpoints (
  id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  endpoint_name TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service_name, endpoint_name),
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
```

### 2. Async Middleware Function

`applyServiceAuthMiddleware` is now async and must be awaited:

```typescript
// Old
const wrapped = applyServiceAuthMiddleware(impl, options);

// New
const wrapped = await applyServiceAuthMiddleware(impl, options);
```

### 3. New Parameter: `serviceName`

You can now specify just the service name, and permissions are fetched from the database:

```typescript
const wrapped = await applyServiceAuthMiddleware(userServiceImplementation, {
  level: 'endpoint',
  serviceName: 'UserService', // Permissions loaded from DB
});
```

## Migration Steps

### 1. Run Database Migration

```bash
npm run prisma:migrate
```

This will create the `service_endpoints` table.

### 2. Seed Endpoint Permissions

```bash
npm run prisma:seed
```

This will populate the endpoint permissions for UserService.

### 3. Update Server Code

Update your `server.ts` (or similar files) to:
- Make the setup function async if not already
- Add `await` before `applyServiceAuthMiddleware`
- Replace `endpointPermissions` with `serviceName`

**Before:**
```typescript
function main() {
  const userServiceWithAuth = applyServiceAuthMiddleware(userServiceImplementation, {
    level: 'endpoint',
    endpointPermissions: { ... },
  });
  
  server.addService({
    serviceName: 'UserService',
    implementation: userServiceWithAuth,
  });
}
```

**After:**
```typescript
async function main() {
  const userServiceWithAuth = await applyServiceAuthMiddleware(userServiceImplementation, {
    level: 'endpoint',
    serviceName: 'UserService',
  });
  
  server.addService({
    serviceName: 'UserService',
    implementation: userServiceWithAuth,
  });
}
```

### 4. Update Tests

If you have custom tests using `applyServiceAuthMiddleware`, add `await`:

```typescript
// Before
const wrapped = applyServiceAuthMiddleware(impl, options);

// After
const wrapped = await applyServiceAuthMiddleware(impl, options);
```

## Benefits

### 1. **No Code Changes for Permission Updates**
You can now update permissions directly in the database without modifying code:

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

### 2. **Centralized Permission Management**
All permissions are stored in the database, making it easier to:
- Audit permissions
- Update permissions dynamically
- Share permissions across services

### 3. **Reduced Code Duplication**
No need to repeat permission mappings in multiple places.

## Adding Permissions for New Endpoints

### Method 1: Via Database Script

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addEndpointPermission() {
  // Get or create permission
  const permission = await prisma.permission.upsert({
    where: { name: 'user:archive' },
    update: {},
    create: {
      name: 'user:archive',
      description: 'Permission to archive users',
    },
  });

  // Link to endpoint
  await prisma.serviceEndpoint.create({
    data: {
      serviceName: 'UserService',
      endpointName: 'archiveUser',
      permissionId: permission.id,
    },
  });
}
```

### Method 2: Via Seed File

Update `prisma/seed.ts` to include new endpoints:

```typescript
const archiveUserPermission = await prisma.permission.upsert({
  where: { name: 'user:archive' },
  update: {},
  create: {
    name: 'user:archive',
    description: 'Permission to archive users',
  },
});

await prisma.serviceEndpoint.upsert({
  where: {
    serviceName_endpointName: {
      serviceName: 'UserService',
      endpointName: 'archiveUser',
    },
  },
  update: {},
  create: {
    serviceName: 'UserService',
    endpointName: 'archiveUser',
    permissionId: archiveUserPermission.id,
  },
});
```

Then run:
```bash
npm run prisma:seed
```

## Backward Compatibility

The manual approach still works for backward compatibility:

```typescript
const wrapped = await applyServiceAuthMiddleware(userServiceImplementation, {
  level: 'endpoint',
  endpointPermissions: {
    getUser: 'user:get',
    // ...
  },
});
```

However, we recommend migrating to the database-driven approach.

## Troubleshooting

### Error: "applyServiceAuthMiddleware is not a function"
Make sure you've rebuilt the project:
```bash
npm run build
```

### Error: "table service_endpoints does not exist"
Run the migration:
```bash
npm run prisma:migrate
```

### No Permissions Loaded
Make sure the `serviceName` matches exactly what's in the database:
```typescript
// Check database
const endpoints = await prisma.serviceEndpoint.findMany({
  where: { serviceName: 'UserService' }, // Must match exactly
});
```

### Server Won't Start
Check that your main function is async:
```typescript
async function main() {
  // ... await applyServiceAuthMiddleware
}

main().catch(console.error);
```

## Need Help?

- Check the updated documentation in `SERVICE_AUTH.md`
- Review examples in `EXAMPLES_SERVICE_AUTH.md`
- See the test files for usage patterns
- Run the test suite: `npm test`

---

**Migration Complete!** Your service authentication now uses database-driven permissions. 🎉
