# Authentication and RBAC Examples

This document provides practical examples of using the authentication and RBAC features.

## Quick Start

### 1. Running Without Authentication (Development)

```bash
# Disable all authentication
ENABLE_AUTH=false USE_TLS=false npm run dev:server
```

This is useful for:
- Local development
- Testing
- Internal networks where security is handled at network level

### 2. Running With HTTP (No TLS)

```bash
# Enable auth but use HTTP
ENABLE_AUTH=true USE_TLS=false npm run dev:server
```

Good for:
- Behind a reverse proxy (nginx, traefik) that handles TLS
- Internal services in a secure network
- Development with authentication testing

### 3. Running With HTTPS (TLS)

```bash
# Enable both auth and TLS
ENABLE_AUTH=true USE_TLS=true npm run dev:server
```

Required for:
- Production deployments
- Public-facing services
- Compliance requirements

## Authentication Levels

### Global Authentication

**Use case**: All endpoints require the same authentication

In `server.ts`:
```typescript
const userServiceWithAuth = applyAuthMiddleware(userServiceImplementation, {
  level: 'global',
  globalRoles: ['admin', 'user'],
});
```

Environment:
```bash
AUTH_LEVEL=global
ENABLE_AUTH=true
```

**Result**: Every endpoint requires a valid JWT with role 'admin' or 'user'

### Service-Level Authentication

**Use case**: Different services have different authentication requirements

In `server.ts`:
```typescript
// User service requires auth
const userServiceWithAuth = applyAuthMiddleware(userServiceImplementation, {
  level: 'service',
  serviceConfig: {
    enabled: true,
    allowedRoles: ['admin', 'user'],
  },
});

// Infra service doesn't require auth
const infraService = infraServiceImplementation;
```

Environment:
```bash
AUTH_LEVEL=service
ENABLE_AUTH=true
```

**Result**: User service requires authentication, infra service is public

### Endpoint-Level Authentication (Recommended)

**Use case**: Fine-grained control over each endpoint

In `server.ts`:
```typescript
const userServiceWithAuth = applyAuthMiddleware(userServiceImplementation, {
  level: 'endpoint',
  endpointConfig: {
    // Only admins can create users
    createUser: { enabled: true, allowedRoles: ['admin'] },
    
    // Admins and regular users can update
    updateUser: { enabled: true, allowedRoles: ['admin', 'user'] },
    
    // Only admins can delete
    deleteUser: { enabled: true, allowedRoles: ['admin'] },
    
    // Anyone authenticated can read
    getUser: { enabled: true, allowedRoles: ['admin', 'user', 'guest'] },
    listUsers: { enabled: true, allowedRoles: ['admin', 'user', 'guest'] },
  },
});
```

Environment:
```bash
AUTH_LEVEL=endpoint
ENABLE_AUTH=true
```

**Result**: Each endpoint has its own authentication and role requirements

## Client Examples

### Example 1: No Authentication

```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync('user.proto');
const proto = grpc.loadPackageDefinition(packageDefinition);

const client = new proto.user.UserService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// No metadata needed when auth is disabled
client.getUser({ id: '123' }, (err, response) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('User:', response.user);
  }
});
```

### Example 2: With Authentication

```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const jwt = require('jsonwebtoken');

const packageDefinition = protoLoader.loadSync('user.proto');
const proto = grpc.loadPackageDefinition(packageDefinition);

const client = new proto.user.UserService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// Create JWT token
const JWT_SECRET = 'super-secret';
const token = jwt.sign(
  { userId: '123', role: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

// Add token to metadata
const metadata = new grpc.Metadata();
metadata.add('authorization', `Bearer ${token}`);

// Make authenticated request
client.getUser({ id: '123' }, metadata, (err, response) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('User:', response.user);
  }
});
```

### Example 3: With TLS

```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const packageDefinition = protoLoader.loadSync('user.proto');
const proto = grpc.loadPackageDefinition(packageDefinition);

// Load TLS credentials
const rootCert = fs.readFileSync('ca.crt');
const credentials = grpc.credentials.createSsl(rootCert);

const client = new proto.user.UserService(
  'localhost:50051',
  credentials
);

// Create token and metadata
const JWT_SECRET = 'super-secret';
const token = jwt.sign(
  { userId: '123', role: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const metadata = new grpc.Metadata();
metadata.add('authorization', `Bearer ${token}`);

// Make secure, authenticated request
client.getUser({ id: '123' }, metadata, (err, response) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('User:', response.user);
  }
});
```

## Role-Based Access Control

### Defining Roles

Roles are defined in the JWT token payload:

```javascript
const token = jwt.sign(
  {
    userId: '123',
    role: 'admin',  // or 'user', 'guest', etc.
    // Add other custom claims as needed
    email: 'admin@example.com',
    permissions: ['read', 'write', 'delete']
  },
  JWT_SECRET
);
```

### Role Hierarchy Example

```typescript
// server.ts - Different roles for different endpoints
const userServiceWithAuth = applyAuthMiddleware(userServiceImplementation, {
  level: 'endpoint',
  endpointConfig: {
    // Public (no auth)
    // (omit from config)
    
    // Guest level - read-only
    getUser: { enabled: true, allowedRoles: ['guest', 'user', 'admin'] },
    listUsers: { enabled: true, allowedRoles: ['guest', 'user', 'admin'] },
    
    // User level - can modify their own data
    updateUser: { enabled: true, allowedRoles: ['user', 'admin'] },
    
    // Admin level - full control
    createUser: { enabled: true, allowedRoles: ['admin'] },
    deleteUser: { enabled: true, allowedRoles: ['admin'] },
  },
});
```

## Error Handling

### Authentication Errors

```javascript
client.getUser({ id: '123' }, metadata, (err, response) => {
  if (err) {
    if (err.code === grpc.status.UNAUTHENTICATED) {
      console.error('Authentication failed: Missing or invalid token');
      // Redirect to login or refresh token
    } else if (err.code === grpc.status.PERMISSION_DENIED) {
      console.error('Authorization failed: Insufficient permissions');
      // Show access denied message
    } else {
      console.error('Other error:', err.message);
    }
  }
});
```

## Testing

### Test with Different Auth Levels

```bash
# Test without auth
ENABLE_AUTH=false npm test

# Test with global auth
AUTH_LEVEL=global npm test

# Test with endpoint auth
AUTH_LEVEL=endpoint npm test
```

### Test with cURL (via grpcurl)

Install grpcurl:
```bash
brew install grpcurl  # macOS
# or
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest
```

Test without auth:
```bash
grpcurl -plaintext -d '{"id": "123"}' \
  localhost:50051 user.UserService/GetUser
```

Test with auth:
```bash
# Generate token first (using node)
TOKEN=$(node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({userId: '123', role: 'admin'}, 'super-secret'))")

grpcurl -plaintext \
  -H "authorization: Bearer $TOKEN" \
  -d '{"id": "123"}' \
  localhost:50051 user.UserService/GetUser
```

## Production Recommendations

1. **Always use TLS in production**: Set `USE_TLS=true`
2. **Use strong JWT secrets**: Set a secure `JWT_SECRET` from environment
3. **Use endpoint-level auth**: Most flexible and secure
4. **Rotate JWT secrets regularly**: Implement key rotation
5. **Use short-lived tokens**: Set appropriate `expiresIn` for JWT
6. **Log authentication failures**: Monitor for security threats
7. **Use HTTPS reverse proxy**: nginx, traefik, or cloud load balancer

## Common Patterns

### Pattern 1: Public Health Check, Protected Services

```typescript
// Infra service - no auth
server.addService({
  protoPath: 'infra.proto',
  packageName: 'infra',
  serviceName: 'InfraService',
  implementation: infraServiceImplementation,
});

// User service - full auth
const userServiceWithAuth = applyAuthMiddleware(userServiceImplementation, {
  level: 'endpoint',
  endpointConfig: {
    createUser: { enabled: true, allowedRoles: ['admin'] },
    updateUser: { enabled: true, allowedRoles: ['admin', 'user'] },
    deleteUser: { enabled: true, allowedRoles: ['admin'] },
    getUser: { enabled: true, allowedRoles: ['admin', 'user'] },
    listUsers: { enabled: true, allowedRoles: ['admin', 'user'] },
  },
});
```

### Pattern 2: Microservices Behind API Gateway

```bash
# Services run without TLS (API gateway handles it)
USE_TLS=false
ENABLE_AUTH=true
AUTH_LEVEL=endpoint

# API Gateway (nginx, traefik, etc.) handles:
# - TLS termination
# - JWT validation
# - Rate limiting
# - Load balancing
```

### Pattern 3: Service-to-Service Communication

```typescript
// Internal service - service-level auth
const internalService = applyAuthMiddleware(serviceImplementation, {
  level: 'service',
  serviceConfig: {
    enabled: true,
    allowedRoles: ['service'], // Special service role
  },
});
```

```javascript
// Service client with service token
const serviceToken = jwt.sign(
  { serviceId: 'billing-service', role: 'service' },
  SERVICE_SECRET
);
```
