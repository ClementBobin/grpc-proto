# API Key vs JWT Authentication - Quick Reference

This guide helps you choose between API key and JWT authentication for your service-to-service communication.

## Quick Comparison

| Feature | API Keys | JWT Tokens |
|---------|----------|------------|
| **Security** | ✅ Higher (individual revocation) | ⚠️ Lower (can't revoke individual tokens) |
| **Expiration** | ✅ Automatic (configurable) | ✅ Built-in (configurable) |
| **Revocation** | ✅ Individual key revocation | ❌ All-or-nothing (change secret) |
| **Usage Tracking** | ✅ Last used timestamp | ❌ No tracking |
| **Key Rotation** | ✅ Easy (generate new, revoke old) | ⚠️ Harder (change secret affects all) |
| **Storage** | Database | Stateless |
| **Performance** | Slightly slower (DB lookup) | Faster (verify signature only) |
| **Setup** | Generate via script | Generate via script |
| **Recommended For** | Production, long-running services | Development, testing |

## When to Use API Keys (Recommended)

Use API keys for:

✅ **Production environments** - Better security and monitoring  
✅ **Long-running services** - Easy rotation without downtime  
✅ **Multiple services** - Individual revocation per service  
✅ **Compliance requirements** - Audit trail via usage tracking  
✅ **Security-sensitive applications** - Quick response to compromised keys  

### Example Use Cases:
- Microservices communicating in production
- Third-party integrations
- Services requiring audit logs
- Systems with compliance requirements (HIPAA, SOC2, etc.)

## When to Use JWT Tokens

Use JWT tokens for:

✅ **Development/Testing** - Faster setup and validation  
✅ **Short-lived sessions** - Tokens with very short expiration  
✅ **Stateless requirements** - No database dependency  
✅ **High-throughput scenarios** - Minimal latency  

### Example Use Cases:
- Local development
- Integration tests
- Temporary access
- Systems where database calls are problematic

## Migration Recommendation

### Phase 1: Development (Start with JWT)
```bash
# Generate JWT token for development
npm run generate:service-token -- --service my-service --role service-admin
```

### Phase 2: Production (Migrate to API Keys)
```bash
# Generate API key for production
npm run generate:api-key -- --service my-service --days 90
```

### Phase 3: Maintenance (Rotate Keys)
```bash
# Generate new key
npm run generate:api-key -- --service my-service --days 90

# Update service configuration with new key

# Revoke old key (using Prisma or custom script)
```

## Best Practices

### For API Keys

1. **Set appropriate expiration periods**:
   - Development: 7-30 days
   - Staging: 30-60 days
   - Production: 60-90 days

2. **Rotate before expiration**:
   - Set up alerts 7 days before expiration
   - Generate new key while old one is still valid
   - Update services gradually
   - Revoke old key after verification

3. **Monitor usage**:
   - Check `last_used_at` field regularly
   - Alert on unused keys
   - Investigate unexpected usage patterns

4. **Secure storage**:
   - Store in environment variables
   - Use secret management systems (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Never commit to version control

### For JWT Tokens

1. **Keep expiration short**: Maximum 1 hour for production
2. **Rotate secrets periodically**: At least quarterly
3. **Use strong secrets**: Minimum 32 characters, random
4. **Monitor for unusual patterns**: Track failed authentications

## Code Examples

### Using API Key

```typescript
import * as grpc from '@grpc/grpc-js';

const API_KEY = process.env.SERVICE_API_KEY;
const metadata = new grpc.Metadata();
metadata.add('service-authorization', `Bearer ${API_KEY}`);

client.GetUser({ id: '123' }, metadata, callback);
```

### Using JWT Token

```typescript
import * as grpc from '@grpc/grpc-js';

const JWT_TOKEN = process.env.SERVICE_JWT_TOKEN;
const metadata = new grpc.Metadata();
metadata.add('service-authorization', `Bearer ${JWT_TOKEN}`);

client.GetUser({ id: '123' }, metadata, callback);
```

**Note**: The code is identical! The server automatically detects which type you're using.

## Transition Strategy

### Zero-Downtime Migration

1. **Generate API keys** for all services
2. **Deploy keys** to all services (as fallback)
3. **Update services** one by one to use API keys
4. **Monitor** to ensure all services are using API keys
5. **Disable JWT** if desired (optional)

### Rollback Plan

If issues occur:
1. Services automatically fall back to JWT tokens
2. No code changes needed
3. Both authentication methods work simultaneously

## Security Considerations

### API Keys Are More Secure When:
- You need to revoke access for specific services
- You want to track which service is making requests
- You need compliance/audit trails
- You want to detect compromised keys quickly

### JWT Tokens Are Adequate When:
- Short expiration times are enforced (<1 hour)
- All services are equally trusted
- Performance is critical
- Database calls are problematic

## Monitoring and Alerts

### Recommended Alerts for API Keys:

```sql
-- Keys expiring in 7 days
SELECT service.name, api_keys.expires_at
FROM api_keys
JOIN services ON api_keys.service_id = services.id
WHERE expires_at <= datetime('now', '+7 days')
  AND expires_at > datetime('now')
  AND is_revoked = false;

-- Unused keys (not used in 30 days)
SELECT service.name, api_keys.created_at, api_keys.last_used_at
FROM api_keys
JOIN services ON api_keys.service_id = services.id
WHERE last_used_at IS NULL 
   OR last_used_at < datetime('now', '-30 days');
```

## Troubleshooting

### API Key Issues

**"Invalid API key"**
- Key doesn't exist in database
- Wrong format (must be 64 hex characters)
- Solution: Regenerate key

**"API key has expired"**
- Key passed expiration date
- Solution: Generate new key with longer expiration

**"API key has been revoked"**
- Key was manually revoked
- Solution: Generate new key, investigate why it was revoked

### JWT Issues

**"Invalid service token"**
- Wrong secret used
- Token expired
- Invalid signature
- Solution: Regenerate token with correct secret

## Summary

**For most production use cases, API keys are recommended** due to:
- Better security (revocation)
- Usage tracking
- Easier key rotation
- Audit compliance

**JWT tokens remain fully supported** for backward compatibility and specific use cases where they're appropriate.

Both methods can coexist, allowing gradual migration without service disruption.
