# grpc-proto

A TypeScript gRPC microservice with Prisma, Zod validation, and comprehensive testing infrastructure.

## Features

- **gRPC**: High-performance RPC framework using @grpc/grpc-js and @grpc/proto-loader
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
- `npm start` - Run the legacy health check application
- `npm start:server` - Run the built gRPC server
- `npm run dev` - Run health check in development mode
- `npm run dev:server` - Run gRPC server in development mode

**Testing:**
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

**Database:**
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:push` - Push schema to database

### Running the gRPC Server

```bash
# Development mode (with hot reload)
npm run dev:server

# Production mode
npm run build
npm run start:server
```

The server will start on `0.0.0.0:50051` and register the following services:
- `infra.InfraService` - Infrastructure health check
- `user.UserService` - User CRUD operations

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

Health check service for monitoring application status:

```protobuf
rpc HealthCheck (HealthCheckRequest) returns (HealthCheckResponse);
```

### UserService

Complete user management CRUD service:

```protobuf
rpc GetUser (GetUserRequest) returns (GetUserResponse);
rpc CreateUser (CreateUserRequest) returns (CreateUserResponse);
rpc UpdateUser (UpdateUserRequest) returns (UpdateUserResponse);
rpc DeleteUser (DeleteUserRequest) returns (DeleteUserResponse);
rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
```

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