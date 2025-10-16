# grpc-proto

A TypeScript project with Prisma, Zod, and Jest testing infrastructure.

## Features

- **Prisma ORM**: Database integration with SQLite
- **Zod**: Schema validation for data integrity
- **Jest**: Comprehensive testing framework
- **TypeScript**: Type-safe development

## Project Structure

```
├── src/
│   ├── BL/              # Business Logic Layer
│   ├── DAL/             # Data Access Layer
│   └── schemas/         # Zod validation schemas
├── Tests/               # Test files
├── __mocks__/           # Mock implementations
└── prisma/              # Prisma schema and migrations
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

The project uses SQLite. The database will be created automatically when you run:

```bash
npm run prisma:push
```

### Scripts

- `npm run build` - Build the TypeScript project
- `npm start` - Start the application
- `npm run dev` - Run in development mode with ts-node
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:push` - Push schema to database

### Running the Application

```bash
# Build and start
npm run build
npm start

# Or run directly in development
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## Development

The project follows a layered architecture:

1. **BL (Business Logic)**: Contains service logic
2. **DAL (Data Access Layer)**: Handles database operations
3. **Schemas**: Zod schemas for validation

All new features should include:
- Proper TypeScript types
- Zod validation schemas
- Unit tests in the `Tests/` directory
- Mocks in the `__mocks__/` directory when needed