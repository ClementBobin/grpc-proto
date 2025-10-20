# Quick Start Guide - Service Authentication

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and set SERVICE_JWT_SECRET
   ```

3. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

4. **Seed the database**
   ```bash
   npm run prisma:seed
   ```

## Generate a Service Token

```bash
npm run generate:service-token -- --service api-rest-service --role service-admin
```

## Make a gRPC Call with Service Auth

### Client Code

```typescript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

// Your service token (generated above)
const serviceToken = 'eyJhbGci...';

// Load proto
const packageDefinition = protoLoader.loadSync('protos/user.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user;

// Create client
const client = new userProto.UserService(
  '0.0.0.0:50051',
  grpc.credentials.createInsecure()
);

// Add service token to metadata
const metadata = new grpc.Metadata();
metadata.add('service-authorization', `Bearer ${serviceToken}`);

// Call GetUser
client.getUser({ id: 'user-id' }, metadata, (err, response) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('User:', response.user);
  }
});
```

## Protect Endpoints on Server

### server.ts

```typescript
import { applyServiceAuthMiddleware } from '@/lib/middleware/serviceAuth.middleware';

// Apply permission-based auth
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

server.addService({
  protoPath: 'user.proto',
  packageName: 'user',
  serviceName: 'UserService',
  implementation: userServiceWithAuth,
});
```

## Create a New Service

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Create role
const role = await prisma.role.create({
  data: { name: 'my-role' },
});

// 2. Create permission
const permission = await prisma.permission.create({
  data: {
    name: 'resource:action',
    description: 'Description',
  },
});

// 3. Link role to permission
await prisma.rolePermission.create({
  data: {
    roleId: role.id,
    permissionId: permission.id,
  },
});

// 4. Create service
const service = await prisma.service.create({
  data: {
    name: 'my-service',
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
```

## Test Everything

```bash
# Run all tests
npm test

# Build
npm run build

# Start server
npm start
```

## Common Issues

### Error: "Missing service token"
- Make sure you're including the `service-authorization` header in metadata
- Format: `Bearer <token>`

### Error: "Invalid service token"
- Check that SERVICE_JWT_SECRET matches between token generation and server
- Verify token hasn't expired
- Ensure token was signed with correct secret

### Error: "Service not found"
- Verify service exists in database
- Check service name matches token's `sub` claim

### Error: "Service does not have permission"
- Check that service has required role in database
- Verify role has required permission
- Run `npm run prisma:seed` to reset seed data

## Environment Variables

```bash
DATABASE_URL="file:./dev.db"
SERVICE_JWT_SECRET=service-super-secret  # Required for service auth
JWT_SECRET=super-secret                   # For user auth (optional)
GRPC_PORT=0.0.0.0:50051
ENABLE_AUTH=true
AUTH_LEVEL=endpoint
```

## Default Credentials

After running `npm run prisma:seed`:

**Service:**
- Name: `api-rest-service`
- Role: `service-admin`
- Permissions: user:get, user:create, user:update, user:delete, user:list

**User:**
- Name: Alice
- Email: alice@example.com

## Next Steps

1. Read `SERVICE_AUTH.md` for detailed documentation
2. Check `EXAMPLES_SERVICE_AUTH.md` for 10 practical examples
3. Review `IMPLEMENTATION_SUMMARY.md` for architecture overview
4. Explore the test files for usage patterns

## Support

For issues or questions:
1. Check the documentation files
2. Review the test files for examples
3. Check the GitHub issues

---

**Ready to use!** 🚀
