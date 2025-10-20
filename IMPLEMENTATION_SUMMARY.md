# Service Authentication Implementation Summary

## What Was Implemented

This implementation adds a complete service authentication system to the gRPC server, allowing services to authenticate and access endpoints based on their assigned permissions.

## Key Features

### 1. Database Schema
- **Roles**: Define roles that can be assigned to services (e.g., `service-admin`)
- **Permissions**: Define specific permissions for operations (e.g., `user:get`, `user:create`)
- **Services**: Represent external services that can authenticate
- **ServiceRoles**: Many-to-many mapping between services and roles
- **RolePermissions**: Many-to-many mapping between roles and permissions
- **User**: Updated with optional `promo_id` field

### 2. Service JWT Authentication
- Separate JWT secret (`SERVICE_JWT_SECRET`) from user authentication
- JWT payload structure:
  ```typescript
  {
    sub: string;    // Service name (e.g., "api-rest-service")
    aud: string;    // Must be "grpc_auth"
    role: string;   // Service role (e.g., "service-admin")
  }
  ```
- Token sent via `service-authorization` metadata header

### 3. Middleware Functions

#### `requireServiceAuth`
Wraps a single handler with service authentication and optional role check.

#### `requireServiceAuthWithPermission`
Wraps a handler with permission-based authentication for fine-grained control.

#### `requireServiceAuthGlobal`
Wraps all methods in a service with the same role requirement.

#### `requireServiceAuthEndpoint`
Applies different permissions to different endpoints (most flexible).

#### `applyServiceAuthMiddleware`
Configurable wrapper that applies auth based on options. **Now async and supports database-driven permissions.**

### 4. Default Seed Data
- **Role**: `service-admin`
- **Permissions**: 
  - `user:get` - Get user details
  - `user:create` - Create users
  - `user:update` - Update users
  - `user:delete` - Delete users
  - `user:list` - List users
- **Service**: `api-rest-service` with `service-admin` role
- **Service Endpoints**: Mappings for UserService endpoints
  - `UserService.getUser` → `user:get`
  - `UserService.createUser` → `user:create`
  - `UserService.updateUser` → `user:update`
  - `UserService.deleteUser` → `user:delete`
  - `UserService.listUsers` → `user:list`
- **User**: Alice (alice@example.com)

### 5. Testing

#### Unit Tests (13 tests)
- Token validation
- Role verification  
- Permission checks
- Invalid token rejection
- Wrong audience rejection
- Service not found handling
- User token rejection
- Global and endpoint-level auth

#### Integration Tests (9 tests)
- Database interactions
- Permission verification
- Token format validation
- Multiple permissions per role
- Service permission checks

**Total: 64 tests (all passing)**

### 6. Helper Tools

#### Token Generator Script
```bash
npm run generate:service-token -- --service api-rest-service --role service-admin
```

#### Example Client Script
Located at `scripts/service-auth-example.ts` - demonstrates proper usage

### 7. Documentation

- **SERVICE_AUTH.md**: Complete system documentation
- **EXAMPLES_SERVICE_AUTH.md**: 10 practical examples
- Inline code comments
- TypeScript types and interfaces

## Usage Example

```typescript
// In server.ts
import { applyServiceAuthMiddleware } from '@/lib/middleware/serviceAuth.middleware';

// Database-driven approach (recommended)
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
```

```typescript
// In client code
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { sub: 'api-rest-service', aud: 'grpc_auth', role: 'service-admin' },
  'service-super-secret',
  { expiresIn: '1h' }
);

const metadata = new grpc.Metadata();
metadata.add('service-authorization', `Bearer ${token}`);

client.getUser({ id: 'user-123' }, metadata, callback);
```

## Files Created/Modified

### New Files
- `src/lib/middleware/serviceAuth.middleware.ts` - Service auth middleware
- `Tests/lib/serviceAuth.middleware.test.ts` - Middleware unit tests
- `Tests/integration/serviceAuth.integration.test.ts` - Integration tests
- `prisma/seed.ts` - Database seed script
- `prisma/migrations/20251020115942_add_service_auth_models/migration.sql` - Database migration
- `scripts/generate-service-token.ts` - Token generator utility
- `scripts/service-auth-example.ts` - Example client implementation
- `src/grpc/userService.server.ts` - Alternative user service implementation
- `SERVICE_AUTH.md` - System documentation
- `EXAMPLES_SERVICE_AUTH.md` - Usage examples

### Modified Files
- `prisma/schema.prisma` - Added service auth models
- `src/lib/config.ts` - Added `serviceJwtSecret` configuration
- `src/server.ts` - Updated to use service authentication
- `.env.example` - Added `SERVICE_JWT_SECRET`
- `package.json` - Added seed and token generation scripts

## Security Features

1. **Separate Secrets**: Service authentication uses a different JWT secret
2. **Audience Validation**: All tokens must have `aud: "grpc_auth"`
3. **Database-Driven**: Permissions are checked against database
4. **Fine-Grained Control**: Per-endpoint permission checks
5. **Token Expiration**: Supports configurable token expiration

## Key Differences from User Auth

| Aspect | User Auth | Service Auth |
|--------|-----------|--------------|
| Metadata Header | `authorization` | `service-authorization` |
| JWT Secret | `JWT_SECRET` | `SERVICE_JWT_SECRET` |
| Payload | `userId`, `role` | `sub`, `aud`, `role` |
| Storage | In-memory/config | Database-driven |
| Granularity | Role-based | Permission-based |

## Testing the Implementation

```bash
# Run all tests
npm test

# Build the project
npm run build

# Generate a service token
npm run generate:service-token -- --service api-rest-service --role service-admin

# Run database seed
npm run prisma:seed
```

## Environment Variables

```bash
# Required
DATABASE_URL="file:./dev.db"
SERVICE_JWT_SECRET=service-super-secret

# Optional
JWT_SECRET=super-secret
GRPC_PORT=0.0.0.0:50051
ENABLE_AUTH=true
AUTH_LEVEL=endpoint
```

## Next Steps / Potential Enhancements

1. Add refresh token support for services
2. Implement token revocation/blacklisting
3. Add audit logging for service calls
4. Create admin API for managing services and permissions
5. Add rate limiting per service
6. Implement service-to-service authentication chains
7. Add OAuth2/OIDC integration for service authentication

## Conclusion

The service authentication system is fully implemented, tested, and documented. It provides:

- ✅ Separate JWT authentication for services
- ✅ Database-driven permission system
- ✅ Fine-grained endpoint access control
- ✅ Comprehensive test coverage (64 tests)
- ✅ Helper utilities and examples
- ✅ Complete documentation
- ✅ Backward compatible with existing user auth

The system is production-ready and can be extended to support additional authentication patterns as needed.
