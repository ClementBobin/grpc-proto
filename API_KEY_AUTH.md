# API Key Authentication Guide

This guide explains how to use API key authentication for service-to-service communication in the gRPC server. API keys provide a more secure alternative to JWT tokens with automatic expiration and revocation capabilities.

## Overview

API key authentication offers several advantages over traditional JWT tokens:

- **Automatic Expiration**: Keys expire after a configurable period (default: 30 days)
- **Revocation Support**: Individual keys can be revoked without affecting other services
- **Usage Tracking**: Last used timestamp is tracked for each key
- **Easy Renewal**: Generate new keys without service downtime
- **Backward Compatibility**: JWT tokens continue to work alongside API keys

## Quick Start

### 1. Generate an API Key

Generate a new API key for a service using the provided script:

```bash
npm run generate:api-key -- --service api-rest-service --days 30
```

**Parameters:**
- `--service <name>`: The service name (must exist in database)
- `--days <number>`: Days until expiration (optional, default: 30)

**Output:**
```
API Key Generated
=================
Service: api-rest-service
Expires At: 2025-11-19T12:48:03.556Z
Days Until Expiration: 30

API Key:
c222fc8893de44ea4d8b6e67a83375204f8e7e71f6bfecee76272431a82ae27a

Use in gRPC metadata:
service-authorization: Bearer c222fc8893de44ea4d8b6e67a83375204f8e7e71f6bfecee76272431a82ae27a
```

**Important:** Store the API key securely. It cannot be retrieved after generation.

### 2. Use the API Key in Requests

Add the API key to your gRPC requests using metadata:

```typescript
import * as grpc from '@grpc/grpc-js';

const metadata = new grpc.Metadata();
metadata.add('service-authorization', `Bearer ${apiKey}`);

client.GetUser({ id: 'user-123' }, metadata, (err, response) => {
  // Handle response
});
```

### 3. Monitor and Renew Keys

API keys automatically expire after the configured period. To renew:

1. Generate a new API key for the service
2. Update your service configuration with the new key
3. (Optional) Revoke the old key if needed

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Number of days until API keys expire (default: 30)
API_KEY_EXPIRATION_DAYS=30
```

### Database Schema

API keys are stored in the `api_keys` table with the following fields:

- `id`: Unique identifier
- `key`: The API key (64 hex characters)
- `service_id`: Reference to the service
- `expires_at`: Expiration timestamp
- `created_at`: Creation timestamp
- `last_used_at`: Last usage timestamp (updated on each request)
- `is_revoked`: Revocation status

## API Reference

### Generate API Key

```typescript
import { createApiKey } from '@/lib/middleware/serviceAuth.middleware';

const { key, expiresAt } = await createApiKey('service-name', 30);
```

**Parameters:**
- `serviceName` (string): The service name
- `expirationDays` (number, optional): Days until expiration

**Returns:**
- `key` (string): The generated API key
- `expiresAt` (Date): Expiration date

### Revoke API Key

```typescript
import { revokeApiKey } from '@/lib/middleware/serviceAuth.middleware';

await revokeApiKey('your-api-key-here');
```

**Parameters:**
- `key` (string): The API key to revoke

### Generate Random API Key

```typescript
import { generateApiKey } from '@/lib/middleware/serviceAuth.middleware';

const key = generateApiKey(); // Returns 64-character hex string
```

## Authentication Flow

1. **Client Request**: Client includes API key in `service-authorization` header
2. **Format Detection**: Middleware detects if token is API key (64 hex chars) or JWT
3. **Validation**:
   - API key exists in database
   - API key is not revoked
   - API key has not expired
4. **Service Lookup**: Service information and permissions are fetched
5. **Authorization**: Permissions are checked against required permissions
6. **Tracking**: Last used timestamp is updated
7. **Request Processing**: Original handler is called if all checks pass

## Best Practices

### Security

1. **Never commit API keys to version control**
2. **Use environment variables** to store API keys
3. **Rotate keys regularly** (before expiration)
4. **Revoke compromised keys** immediately
5. **Monitor last used timestamps** to detect suspicious activity

### Key Management

1. **Set appropriate expiration periods** based on security requirements
2. **Document key ownership** and purpose
3. **Implement key rotation procedures**
4. **Keep track of active keys** per service
5. **Clean up expired/revoked keys** periodically

### Monitoring

1. **Track key usage** via `last_used_at` field
2. **Alert on expiring keys** (e.g., 7 days before expiration)
3. **Log authentication failures**
4. **Monitor for unusual patterns**

## Migration from JWT

If you're currently using JWT tokens, you can migrate gradually:

1. **Generate API keys** for all services
2. **Update services one at a time** to use API keys
3. **Keep JWT authentication enabled** during migration
4. **Verify all services are using API keys**
5. **(Optional) Disable JWT authentication** if desired

Both JWT and API key authentication work simultaneously, allowing for zero-downtime migration.

## Troubleshooting

### "Invalid API key"

**Causes:**
- API key doesn't exist in database
- API key format is incorrect (must be 64 hex characters)

**Solution:**
- Verify the API key is correct
- Generate a new API key if needed

### "API key has expired"

**Cause:** The API key has passed its expiration date

**Solution:**
- Generate a new API key
- Update your service configuration

### "API key has been revoked"

**Cause:** The API key was manually revoked

**Solution:**
- Generate a new API key
- Investigate why the key was revoked

### "Service not found"

**Cause:** The service referenced by the API key doesn't exist in the database

**Solution:**
- Verify the service exists in the database
- Check the service name matches exactly

## Examples

### Example 1: Basic Authentication

```typescript
import * as grpc from '@grpc/grpc-js';
import { createApiKey } from './lib/middleware/serviceAuth.middleware';

// Generate key
const { key } = await createApiKey('my-service', 30);

// Use key
const metadata = new grpc.Metadata();
metadata.add('service-authorization', `Bearer ${key}`);

client.SomeMethod(request, metadata, callback);
```

### Example 2: Key Rotation

```typescript
// Generate new key
const { key: newKey } = await createApiKey('my-service', 30);

// Update configuration
process.env.SERVICE_API_KEY = newKey;

// Revoke old key
await revokeApiKey(oldKey);
```

### Example 3: Checking Key Expiration

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Find keys expiring soon (within 7 days)
const expiringKeys = await prisma.apiKey.findMany({
  where: {
    expiresAt: {
      lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      gte: new Date(),
    },
    isRevoked: false,
  },
  include: {
    service: true,
  },
});

expiringKeys.forEach(key => {
  console.log(`Key for ${key.service.name} expires on ${key.expiresAt}`);
});
```

## Related Documentation

- [Service Authentication Guide](./SERVICE_AUTH.md)
- [Quick Start Guide](./QUICKSTART_SERVICE_AUTH.md)
- [Examples](./EXAMPLES_SERVICE_AUTH.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
