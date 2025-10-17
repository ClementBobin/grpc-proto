# grpc-proto

A TypeScript gRPC microservice with Prisma, Zod validation, and comprehensive testing infrastructure.

## Features

- **gRPC**: High-performance RPC framework using @grpc/grpc-js and @grpc/proto-loader
- **HTTP/HTTPS Support**: Configurable to run with or without TLS
- **RBAC (Role-Based Access Control)**: Flexible authentication at global, service, or endpoint level
- **JWT Authentication**: Secure token-based authentication with role verification
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
- **ENABLE_AUTH**: Set to `false` to disable authentication (default: true)
- **AUTH_LEVEL**: Choose `global`, `service`, or `endpoint` (default: endpoint)
- **JWT_SECRET**: Secret key for JWT token signing

See `.env.example` for all available options.

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

## Authentication & RBAC

The server supports three levels of authentication configuration:

### 1. Global Authentication

All services and endpoints require authentication:

```typescript
// In server.ts
const userServiceWithAuth = applyAuthMiddleware(userServiceImplementation, {
  level: 'global',
  globalRoles: ['admin', 'user'],
});
```

Environment configuration:
```bash
AUTH_LEVEL=global
ENABLE_AUTH=true
```

### 2. Service-Level Authentication

Configure authentication per service:

```typescript
const userServiceWithAuth = applyAuthMiddleware(userServiceImplementation, {
  level: 'service',
  serviceConfig: {
    enabled: true,
    allowedRoles: ['admin', 'user'],
  },
});
```

Environment configuration:
```bash
AUTH_LEVEL=service
ENABLE_AUTH=true
```

### 3. Endpoint-Level Authentication (Default)

Configure authentication per endpoint for fine-grained control:

```typescript
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

Environment configuration:
```bash
AUTH_LEVEL=endpoint
ENABLE_AUTH=true
```

### Disabling Authentication

To disable authentication entirely:

```bash
ENABLE_AUTH=false
```

### Using JWT Tokens

To make authenticated requests, include a JWT token in the metadata:

```javascript
const metadata = new grpc.Metadata();
const token = jwt.sign({ userId: '123', role: 'admin' }, JWT_SECRET);
metadata.add('authorization', `Bearer ${token}`);

// Make the gRPC call with metadata
client.getUser({ id: '123' }, metadata, (err, response) => {
  // Handle response
});
```

### Token Structure

JWT tokens should contain at minimum:
- `userId`: User identifier
- `role`: User role (e.g., 'admin', 'user', 'guest')

The role is used for RBAC checks when `allowedRoles` is specified.

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
6. Register the service in `src/server.ts`
7. Add tests in `Tests/`