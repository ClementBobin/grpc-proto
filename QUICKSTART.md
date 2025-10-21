# Quick Start Guide

This guide will help you quickly set up and use the gRPC service with API key authentication.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up the database:**
```bash
export DATABASE_URL="file:./dev.db"
npm run prisma:push
npm run prisma:seed
```

3. **Generate an API key:**
```bash
npm run generate:api-key -- --service api-rest-service --days 30
```

Save the generated API key - you'll need it for making authenticated requests.

## Starting the Server

```bash
npm run dev:server
```

The server will:
- Connect to the database
- Automatically apply authentication middleware based on DB configuration
- Start listening on port 50051

## Making Requests

### Without Authentication (Health Check)

The `InfraService.healthCheck` endpoint doesn't require authentication:

```typescript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDefinition = protoLoader.loadSync('protos/infra.proto');
const proto = grpc.loadPackageDefinition(packageDefinition);

const client = new proto.infra.InfraService(
  '0.0.0.0:50051',
  grpc.credentials.createInsecure()
);

client.healthCheck({}, (error, response) => {
  console.log(response);
});
```

### With Authentication (User Service)

All `UserService` endpoints require API key authentication:

```typescript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDefinition = protoLoader.loadSync('protos/user.proto');
const proto = grpc.loadPackageDefinition(packageDefinition);

const client = new proto.user.UserService(
  '0.0.0.0:50051',
  grpc.credentials.createInsecure()
);

// Add API key to metadata
const metadata = new grpc.Metadata();
metadata.add('service-authorization', `Bearer ${apiKey}`);

// Make authenticated request
client.getUser({ id: 'user-id' }, metadata, (error, response) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('User:', response.user);
});
```

## How Authentication Works

1. **Database Configuration**: Endpoint permissions are stored in the `ServiceEndpoint` table
2. **Auto-Applied**: When services are registered, authentication middleware is automatically applied
3. **Permission Check**: Each request verifies that the service has the required permission
4. **No Manual Setup**: Developers don't need to manually configure or apply middleware

## Adding New Endpoints

1. **Define the endpoint in proto file:**
```protobuf
service MyService {
  rpc MyEndpoint (MyRequest) returns (MyResponse);
}
```

2. **Create the handler:**
```typescript
export const myServiceImplementation = {
  myEndpoint: async (call, callback) => {
    // Implementation
  }
};
```

3. **Register the service:**
```typescript
await server.addService({
  protoPath: 'my.proto',
  packageName: 'my',
  serviceName: 'MyService',
  implementation: myServiceImplementation,
  // applyAuth: true by default
});
```

4. **Configure permissions in database:**
```typescript
// In seed.ts or migration
await prisma.serviceEndpoint.create({
  data: {
    serviceName: 'MyService',
    endpointName: 'myEndpoint',
    permissionId: myPermission.id,
  },
});
```

That's it! The authentication middleware will be automatically applied.

## Testing

Run tests with:
```bash
npm test
```

Tests use the Prisma mock singleton from `__mocks__/singleton.ts` for database interactions.

## Common Issues

### API Key Not Working

- Check that the API key hasn't expired
- Verify the service has the required permission
- Ensure the API key hasn't been revoked

### Permission Denied

- Check that the endpoint is configured in the `ServiceEndpoint` table
- Verify the service has the required role and permissions
- Review the seed file to ensure permissions are properly assigned

## Next Steps

- Review `prisma/seed.ts` to understand the default configuration
- Check `Tests/lib/serviceAuth.middleware.test.ts` for testing examples
- Read the main README.md for detailed documentation
