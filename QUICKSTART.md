# Quick Start Guide

## Installation

```bash
npm install
```

## Running the Server

### Option 1: HTTP without Authentication (Quickest Start)

```bash
ENABLE_AUTH=false USE_TLS=false npm run dev
```

### Option 2: HTTP with Authentication

```bash
# Uses default endpoint-level authentication
npm run dev
```

### Option 3: HTTPS with Authentication

```bash
# Requires certificate files: server.crt, server.key, ca.crt
USE_TLS=true npm run dev
```

## Configuration Files

Create `.env` from example:
```bash
cp .env.example .env
```

Edit `.env` to customize:
- `USE_TLS=false` - Run with HTTP (no encryption)
- `USE_TLS=true` - Run with HTTPS (requires certificates)
- `ENABLE_AUTH=false` - Disable authentication
- `ENABLE_AUTH=true` - Enable authentication
- `AUTH_LEVEL=endpoint` - Configure auth per-endpoint (recommended)
- `AUTH_LEVEL=service` - Configure auth per-service
- `AUTH_LEVEL=global` - Require auth for everything

## Common Tasks

### Build and Test
```bash
npm run verify
```

### Run Tests Only
```bash
npm test
```

### Production Build
```bash
npm run build
npm start
```

### Development with Hot Reload
```bash
npm run dev
```

## Database Setup

```bash
# Set database URL (or use .env)
export DATABASE_URL="file:./dev.db"

# Initialize database
npm run prisma:push
```

## Documentation

- [README.md](./README.md) - Full documentation
- [EXAMPLES.md](./EXAMPLES.md) - Detailed usage examples
- [.env.example](./.env.example) - Configuration template

## Troubleshooting

### Server won't start with TLS

Make sure certificate files exist:
```bash
ls -la server.crt server.key ca.crt
```

Or disable TLS:
```bash
USE_TLS=false npm run dev
```

### Authentication errors

Disable auth for testing:
```bash
ENABLE_AUTH=false npm run dev
```

### Database errors

Set DATABASE_URL:
```bash
export DATABASE_URL="file:./dev.db"
npm run prisma:push
```

## Need Help?

- Check [README.md](./README.md) for detailed documentation
- See [EXAMPLES.md](./EXAMPLES.md) for code examples
- Review test files in `Tests/` directory for usage patterns
