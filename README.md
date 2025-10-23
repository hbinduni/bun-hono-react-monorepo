# Bun + Hono + React Monorepo Template

A modern full-stack monorepo template with Bun, Hono backend, React frontend, PostgreSQL database, and Docker deployment.

[![Bun](https://img.shields.io/badge/Bun-1.3.0-black)](https://bun.sh)
[![Hono](https://img.shields.io/badge/Hono-latest-orange)](https://hono.dev)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-purple)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://typescriptlang.org)
[![Biome](https://img.shields.io/badge/Biome-2.2.7-60a5fa)](https://biomejs.dev)

## 🎯 What is This?

This is a **production-ready monorepo template** for building full-stack applications. Clone it, customize it, and start building your project in minutes.

## ✨ Features

- ✅ **Modern Stack**: Hono + React 19 + Vite 7 + TypeScript
- ✅ **Fast**: Powered by Bun for blazing fast package management and runtime
- ✅ **Type Safety**: Shared types between frontend and backend
- ✅ **Monorepo**: Efficient code sharing with Bun workspaces + Turborepo
- ✅ **Database**: PostgreSQL 16 with schema and seed scripts
- ✅ **Linting**: Biome.js for fast linting and formatting
- ✅ **Testing**: Bun test with coverage support
- ✅ **Docker**: Production-ready multi-stage builds with docker-compose
- ✅ **Hot Reload**: Development mode with instant updates

## 📦 Project Structure

```
monorepo/
├── server/              # Hono backend (TypeScript)
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── client/              # React + Vite frontend (TypeScript)
│   ├── src/
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── packages/
│   └── shared/          # Shared types and utilities
├── db/                  # Database schema and seeds
│   ├── schema.sql
│   └── seed.sql
├── tests/               # Test files
├── docker-compose.yml   # Docker orchestration
├── turbo.json          # Turborepo configuration
├── Makefile            # Docker convenience commands
└── package.json        # Root workspace configuration
```

## 🚀 Quick Start

> **Want to use this as a template?** See [TEMPLATE.md](./TEMPLATE.md) for detailed customization instructions.

### Prerequisites
- [Bun](https://bun.sh) >= 1.3.0
- [Docker](https://docker.com) (for production deployment)
- PostgreSQL 16 (for local development)

### Installation

```bash
# Install all dependencies
bun install
```

### Development

```bash
# Run both server and client
bun dev

# Run only server (http://localhost:3000)
bun dev:server

# Run only client (http://localhost:5173)
bun dev:client
```

### Building

```bash
# Build all packages with Turborepo
bun build

# Type check all packages
bun typecheck

# Lint and format with Biome
bun check
bun check:fix
```

### Testing

```bash
# Run all tests
bun test

# Watch mode
bun test:watch

# Coverage report
bun test:coverage

# Health check
bun test:health
```

### Database

```bash
# Create database schema
bun db:create

# Seed database with sample data
bun db:seed

# Fresh database (drop, create, seed)
bun db:fresh

# Run custom SQL file
bun db:run path/to/file.sql
```

## 🐳 Docker Deployment

See [DOCKER.md](./DOCKER.md) for comprehensive Docker deployment guide.

```bash
# Build images
make build

# Start all services
make up

# View logs
make logs

# Stop services
make down
```

## 📝 Workspace Packages

### `@monorepo/server`
Hono-based backend server with:
- TypeScript support
- CORS configuration
- Path aliases (@server, @shared)
- Hot reload in development
- Optimized Docker build

### `@monorepo/client`
React + Vite frontend with:
- React 19 with TypeScript
- Path aliases (@, @shared)
- Nginx configuration for production
- Optimized Docker build

### `@monorepo/shared`
Shared code between server and client:
- TypeScript types
- Utility functions
- Constants and configurations

## 🔧 Adding Dependencies

```bash
# Add to server
bun add <package> --filter @monorepo/server

# Add to client
bun add <package> --filter @monorepo/client

# Add to shared
bun add <package> --filter @monorepo/shared

# Add dev dependency to root
bun add -d <package>
```

## 🎨 Path Aliases

The project uses TypeScript path aliases for clean imports:

**Server:**
```typescript
import { User } from '@shared/types'        // Shared types
import { db } from '@server/utils/db'       // Server modules
```

**Client:**
```typescript
import { User } from '@shared/types'        // Shared types
import { api } from '@/utils/api'           // Client modules
```

**Available Aliases:**
- `@server/*` → `server/src/*` (server-side)
- `@/*` → `client/src/*` (client-side)
- `@shared/*` → `packages/shared/src/*` (both)

## 📚 Documentation

- [TEMPLATE.md](./TEMPLATE.md) - How to use this as a project template
- [DOCKER.md](./DOCKER.md) - Docker deployment guide
- [QUICK_START.md](./QUICK_START.md) - Quick reference guide

## 🛠️ Tech Stack

### Runtime & Package Manager
- **Bun 1.3.0**: JavaScript runtime and package manager

### Backend
- **Hono**: Lightweight web framework
- **TypeScript 5.9**: Type safety and modern JavaScript

### Frontend
- **React 19**: UI library
- **Vite 7**: Build tool and dev server
- **TypeScript 5.9**: Type safety

### Database
- **PostgreSQL 16**: Relational database

### Build Tools
- **Turborepo**: Monorepo build system
- **Biome.js 2.2.7**: Linter and formatter

### DevOps
- **Docker**: Containerization
- **Nginx**: Web server for production
- **docker-compose**: Multi-container orchestration

## 🤝 Contributing

This is a template repository. Feel free to fork it and customize it for your needs. If you have improvements that would benefit the template itself, pull requests are welcome!

## 📄 License

MIT License - feel free to use this template for any purpose.

## ⭐ Support

If you find this template useful, please give it a star on GitHub!

---

**Happy Building!** 🚀

Made with ❤️ using Bun, Hono, and React
