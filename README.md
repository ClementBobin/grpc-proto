# grpc-proto

A TypeScript gRPC microservice with Prisma, Zod validation, and comprehensive testing infrastructure.

## Features

- **gRPC**: High-performance RPC framework using @grpc/grpc-js and @grpc/proto-loader
- **HTTP/HTTPS Support**: Configurable to run with or without TLS
- **API Key Authentication**: Secure, renewable API keys with automatic expiration and revocation support
- **Auto-Applied Middleware**: Authentication middleware automatically applied based on database configuration
- **Permission-Based Access Control**: Fine-grained endpoint-level permissions stored in database
- **Prisma ORM**: Database integration with SQLite
- **Zod**: Schema validation for data integrity
- **Jest**: Comprehensive testing framework
- **TypeScript**: Type-safe development with path aliases (@/*)
- **Module Alias**: Runtime path resolution for production builds

## Project Structure

```
├── proto/                    # Protocol Buffer definitions
│   ├── infra.proto          # Infrastructure service
│   └── user.proto           # User service
├── src/
│   ├── server.ts            # Main gRPC server entry point
│   ├── index.ts             # Legacy entry point (health check)
│   ├── grpc/                # gRPC service implementations
│   │   ├── infra.server.ts # Infrastructure gRPC handlers
│   │   └── user.server.ts  # User gRPC handlers
│   ├── BL/                  # Business Logic Layer
│   │   ├── infra.service.ts
│   │   └── user.service.ts
│   ├── DTO/                 # Data Transfer Objects & Zod schemas
│   │   ├── infra.dto.ts
│   │   └── user.dto.ts
│   ├── DAL/                 # Data Access Layer (Repositories)
│   │   ├── infra.repository.ts
│   │   └── user.repository.ts
│   └── lib/                 # Shared libraries
│       └── grpc.ts          # gRPC server helper
├── Tests/                   # Test files
├── __mocks__/              # Mock implementations
└── prisma/                 # Prisma schema and migrations
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

```bash
npm install
```

### Configuration

Copy the example environment file and configure as needed:

```bash
cp .env.example .env
```

Key configuration options:

- **USE_TLS**: Set to `true` for HTTPS/TLS, `false` for HTTP (default: false)
- **API_KEY_EXPIRATION_DAYS**: Number of days until API keys expire (default: 30)
- **DATABASE_URL**: Database connection URL

**Note**: Authentication is now automatically applied based on database configuration. No need to manually configure auth levels or middleware.

#### Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `GRPC_PORT` | `0.0.0.0:50051` | gRPC server bind address and port |
| `USE_TLS` | `false` | Enable TLS/HTTPS (`true`/`false`) |
| `TLS_CERT_PATH` | `./server.crt` | Path to TLS certificate file |
| `TLS_KEY_PATH` | `./server.key` | Path to TLS private key file |
| `TLS_CA_PATH` | `./ca.crt` | Path to CA certificate (optional) |
| `API_KEY_EXPIRATION_DAYS` | `30` | Days until API keys expire |
| `DATABASE_URL` | `file:./dev.db` | Database connection URL |

### Database Setup

The project uses SQLite. Set the `DATABASE_URL` environment variable:

```bash
export DATABASE_URL="file:./dev.db"
```

Then push the schema to the database:

```bash
npm run prisma:push
```

### Scripts

**Build & Run:**
- `npm run build` - Build the TypeScript project
- `npm start` - Run the gRPC server (production)
- `npm run start:server` - Run the gRPC server (production)
- `npm run start:client` - Run the legacy health check client (production)
- `npm run dev` - Run gRPC server in development mode
- `npm run dev:server` - Run gRPC server in development mode
- `npm run dev:client` - Run legacy health check in development mode

**Testing:**
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run verify` - Build and test the project (recommended before commits)

**Database:**
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:push` - Push schema to database
- `npm run prisma:seed` - Seed database with default data

**Service Authentication:**
- `npm run generate:service-token` - Generate service JWT token
- `npm run generate:api-key` - Generate API key for service authentication

### Running the gRPC Server

#### Running without TLS (HTTP mode - insecure)

```bash
# Using environment variable
USE_TLS=false npm run dev:server

# Or set in .env file
# USE_TLS=false
npm run dev:server
```

#### Running with TLS (HTTPS mode - secure)

First, generate SSL certificates (for development):

```bash
# Generate private key
openssl genrsa -out server.key 2048

# Generate certificate signing request
openssl req -new -key server.key -out server.csr

# Generate self-signed certificate
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

# Optional: Generate CA certificate
openssl req -new -x509 -days 365 -key server.key -out ca.crt
```

Then start the server:

```bash
# Using environment variable
USE_TLS=true npm run dev:server

# Or set in .env file
# USE_TLS=true
npm run dev:server
```

#### Production mode

```bash
npm run build
npm run start:server
```

The server will start and display configuration:
```
Starting gRPC Server...
Configuration:
  - Port: 0.0.0.0:50051
  - TLS: Disabled
  - Auth: Enabled
  - Auth Level: endpoint

🚀 gRPC Server started on 50051
   Protocol: gRPC insecure
   Auth: Enabled
   Auth Level: endpoint

📋 Registered services:
  - infra.InfraService
  - user.UserService
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Architecture

The project follows a clean layered architecture with gRPC:

1. **proto/**: Protocol Buffer definitions for gRPC services
2. **grpc/**: gRPC service implementations (handlers)
3. **BL (Business Logic)**: Service layer containing business rules
4. **DTO (Data Transfer Objects)**: TypeScript types and Zod validation schemas
5. **DAL (Data Access Layer)**: Repository pattern for database operations
6. **lib/**: Shared utilities and helpers

### Path Aliases

The project uses `@/*` as an alias for `src/*`:

```typescript
import { UserService } from '@/BL/user.service';
import { UserSchema } from '@/DTO/user.dto';
import { GrpcServer } from '@/lib/grpc';
```

Path aliases work in both development (via tsconfig-paths) and production (via module-alias).

## Services

### InfraService

Health check service for monitoring application status (no authentication required):

```protobuf
rpc HealthCheck (HealthCheckRequest) returns (HealthCheckResponse);
```

### UserService

Complete user management CRUD service with RBAC:

```protobuf
rpc GetUser (GetUserRequest) returns (GetUserResponse);
rpc CreateUser (CreateUserRequest) returns (CreateUserResponse);
rpc UpdateUser (UpdateUserRequest) returns (UpdateUserResponse);
rpc DeleteUser (DeleteUserRequest) returns (DeleteUserResponse);
rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
```

## Service Authentication

This project includes a comprehensive service authentication system that allows external services to authenticate using either JWT tokens or API keys with automatic expiration.

### API Key Authentication (Recommended)

API keys provide better security with automatic expiration and revocation capabilities.

1. **Generate an API key:**
```bash
npm run generate:api-key -- --service api-rest-service --days 30
```

2. **Use the API key in gRPC calls:**
```typescript
const metadata = new grpc.Metadata();
metadata.add('service-authorization', `Bearer ${apiKey}`);
client.getUser({ id: 'user-123' }, metadata, callback);
```

3. **Key features:**
- Automatic expiration (configurable, default 30 days)
- Individual revocation support
- Usage tracking (last used timestamp)
- Auto-applied based on database configuration

### Documentation

- [API_KEY_AUTH.md](./API_KEY_AUTH.md) - Complete API key authentication guide
- [QUICKSTART_SERVICE_AUTH.md](./QUICKSTART_SERVICE_AUTH.md) - Getting started guide
- [SERVICE_AUTH.md](./SERVICE_AUTH.md) - Complete system documentation
- [EXAMPLES_SERVICE_AUTH.md](./EXAMPLES_SERVICE_AUTH.md) - 10 practical examples
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Architecture overview

### Features

- **Database-driven permissions**: Services, roles, and permissions stored in database
- **API key authentication**: Secure API key-based authentication
- **API key expiration**: Automatic expiration with configurable periods
- **Revocation support**: Individual API keys can be revoked
- **Auto-applied middleware**: Authentication automatically applied based on database configuration
- **Fine-grained access control**: Permission-based endpoint protection
- **Comprehensive testing**: Complete test coverage with Prisma mock singleton
- **Helper utilities**: API key generator script

### Environment Variables

```bash
API_KEY_EXPIRATION_DAYS=30  # Days until API keys expire (default: 30)
DATABASE_URL="file:./dev.db"  # Database connection URL
```

### Default Service

After running `npm run prisma:seed`:
- Service: `api-rest-service`
- Role: `service-admin`
- Permissions: user:get, user:create, user:update, user:delete, user:list

## Authentication & Permission-Based Access Control

The server uses **automatic API key authentication** based on database configuration. No manual middleware setup required!

### How It Works

1. **Database Configuration**: Endpoint permissions are stored in the database (`ServiceEndpoint` table)
2. **Auto-Applied Middleware**: Authentication middleware is automatically applied when services are registered
3. **Permission Checking**: Each endpoint checks if the service has the required permission

### Configuring Endpoint Permissions

Permissions are configured in the database during seeding (see `prisma/seed.ts`):

```typescript
// Example: Configure permissions for UserService endpoints
await prisma.serviceEndpoint.create({
  data: {
    serviceName: 'UserService',
    endpointName: 'getUser',
    permissionId: getUserPermission.id,
  },
});
```

### Adding Services with Auto-Applied Auth

In `server.ts`, simply register your service. Auth middleware is applied automatically:

```typescript
// Infrastructure service - no auth needed
await server.addService({
  protoPath: 'infra.proto',
  packageName: 'infra',
  serviceName: 'InfraService',
  implementation: infraServiceImplementation,
  applyAuth: false, // Explicitly disable auth
});

// User service - auth auto-applied from DB config
await server.addService({
  protoPath: 'user.proto',
  packageName: 'user',
  serviceName: 'UserService',
  implementation: userServiceImplementation,
  // applyAuth defaults to true
});
```

### Making Authenticated Requests

Use API keys in the `service-authorization` header:

```typescript
const metadata = new grpc.Metadata();
metadata.add('service-authorization', `Bearer ${apiKey}`);

// Make the gRPC call with metadata
client.getUser({ id: '123' }, metadata, (err, response) => {
  // Handle response
});
```

### Benefits

- **No Manual Configuration**: Developers don't need to wrap handlers with middleware
- **Database-Driven**: All permissions managed in the database
- **Consistent**: Same authentication pattern across all services
- **Testable**: Easy to test with Prisma mock singleton

## Development Guidelines

All new features should include:
- Protocol Buffer definitions in `proto/`
- gRPC service implementation in `src/grpc/`
- Business logic in `src/BL/`
- Data types and validation in `src/DTO/`
- Repository implementation in `src/DAL/`
- Comprehensive unit tests in `Tests/`
- Mocks in `__mocks__/` when needed

### Adding a New Service

1. Define the service in a `.proto` file in `proto/`
2. Create DTOs with Zod schemas in `src/DTO/`
3. Create repository in `src/DAL/`
4. Create service in `src/BL/`
5. Create gRPC handlers in `src/grpc/`
6. Register the service in `src/server.ts` (auth middleware auto-applied)
7. Configure endpoint permissions in the database (via seed or migrations)
8. Add tests in `Tests/` (use Prisma mock singleton from `__mocks__/`)