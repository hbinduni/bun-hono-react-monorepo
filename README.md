# Bun + Hono + React Monorepo Template

A modern full-stack monorepo template with Bun, Hono backend, React frontend, PostgreSQL database, and Docker deployment.

[![Bun](https://img.shields.io/badge/Bun-1.3.0-black)](https://bun.sh)
[![Hono](https://img.shields.io/badge/Hono-latest-orange)](https://hono.dev)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-purple)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com)
[![Biome](https://img.shields.io/badge/Biome-2.2.7-60a5fa)](https://biomejs.dev)

## 🎯 What is This?

This is a **production-ready monorepo template** for building full-stack applications. Clone it, customize it, and start building your project in minutes.

## ✨ Features

- ✅ **Modern Stack**: Hono + React 19 + Vite 7 + TypeScript 5.9
- ✅ **Tailwind CSS 4**: Latest Tailwind with Vite plugin integration
- ✅ **Fast**: Powered by Bun for blazing fast package management and runtime
- ✅ **Type Safety**: Shared types between frontend and backend
- ✅ **Monorepo**: Efficient code sharing with Bun workspaces + Turborepo
- ✅ **Database**: PostgreSQL 16 with schema and seed scripts
- ✅ **Linting**: Biome.js with Tailwind class sorting support
- ✅ **Testing**: Bun test with coverage support
- ✅ **Docker**: Production-ready multi-stage builds with docker-compose
- ✅ **Kubernetes**: Complete K8s deployment with comprehensive Makefile commands
- ✅ **Hot Reload**: Development mode with instant updates
- ✅ **Environment Variables**: Comprehensive env management with runtime config injection

## 📦 Project Structure

```
monorepo/
├── server/              # Hono backend (TypeScript)
│   ├── src/
│   │   └── index.ts     # Server entry point
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json     # @monorepo/server
├── client/              # React + Vite frontend (TypeScript)
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   │   └── layout/  # Layout components (Header, Footer, Layout)
│   │   ├── pages/       # Page components (Home, etc.)
│   │   ├── api/         # API client layer
│   │   ├── assets/      # Static assets
│   │   ├── App.tsx      # Root application component
│   │   ├── main.tsx     # Client entry point
│   │   └── config.ts    # Runtime configuration
│   ├── .env.example
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json     # @monorepo/client
├── packages/
│   └── shared/          # Shared types and utilities
│       ├── src/
│       │   ├── types/   # Domain models (User, Item, ApiResponse)
│       │   └── utils/   # Shared utilities
│       └── package.json # @monorepo/shared
├── db/                  # Database schema and seeds
│   ├── schema.sql       # PostgreSQL schema with triggers
│   └── seed.sql         # Sample data
├── tests/               # Test files
├── docker-compose.yml   # Docker orchestration
├── turbo.json          # Turborepo configuration
├── biome.json          # Linting/formatting config
├── Makefile            # Docker convenience commands
└── package.json        # Root workspace configuration
```

### Workspace Architecture

- **Root**: Turborepo orchestration, shared tooling (Biome, TypeScript)
- **server/** (`@monorepo/server`): Hono API server running on Bun with hot reload
- **client/** (`@monorepo/client`): React 19 + Vite 7 frontend with component-based architecture
  - `components/layout/` - Reusable layout components (Header, Footer, Layout)
  - `pages/` - Page-level components (Home, etc.)
  - `api/` - API client layer for backend communication
- **packages/shared/** (`@monorepo/shared`): Shared TypeScript types and utilities (exports `.ts` source directly)

## 🚀 Quick Start

> **Want to use this as a template?** See [TEMPLATE.md](./TEMPLATE.md) for detailed customization instructions.

### Prerequisites
- [Bun](https://bun.sh) >= 1.3.0
- [Docker](https://docker.com) (for production deployment)
- PostgreSQL 16 (for local development)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd bun-hono-react-monorepo

# Install all dependencies
bun install

# Set up environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Set up database (PostgreSQL must be running)
bun db:create  # Create schema
bun db:seed    # Add sample data
```

### Development

```bash
# Run both server and client (recommended)
bun dev

# Run individually
bun dev:server  # Server only (http://localhost:3000)
bun dev:client  # Client only (http://localhost:5173)

# The client proxies /api/* requests to the server automatically
```

**How it works:**
- Server runs on port 3000 with `bun run --hot` for instant reload
- Client runs on port 5173 with Vite HMR
- Vite dev server proxies `/api/*` → `http://localhost:3000` (see `client/vite.config.ts`)
- Turborepo runs tasks in parallel with caching
- Server auto-loads seed data (demo user + sample items) — no database setup needed to start

## 🔧 Development Workflows

### Building

```bash
# Build all packages with Turborepo
bun build

# Build specific workspace
bun build:server  # Outputs to server/dist/
bun build:client  # Outputs to client/dist/

# Type check all packages (uses tsgo - native TypeScript compiler)
bun typecheck
```

### Quality Checks

```bash
# Biome linting and formatting
bun check           # Check without fixing
bun check:fix       # Check and auto-fix (includes Tailwind class sorting)
bun check:all       # typecheck + check
bun check:all:fix   # typecheck + check with fixes (includes Tailwind sorting)

# Individual operations
bun lint            # Lint only
bun format          # Format with write

# Pre-commit workflow
bun run precommit   # Runs check:all:fix + tests (includes Tailwind sorting)
```

**Biome Configuration** (`biome.json`):
- **Formatter**: 120 line width, 2 spaces, single quotes, no semicolons (asNeeded), no bracket spacing
- **Linter**: Recommended rules + strict unused imports, type imports enforced, Node.js import protocol required
- **Tailwind Sorting**: `nursery.useSortedClasses` enabled for automatic Tailwind CSS class ordering (requires `--unsafe` flag)
- **Import Organization**: Auto-organize with URL → PACKAGE_WITH_PROTOCOL → NODE → PACKAGE → ALIAS → PATH → RELATIVE
- **Overrides**: Tests allow `any` type, generated files disable all checks, CSS files allow unknown at-rules (Tailwind support)

### Testing

```bash
# Run all tests
bun test

# Watch mode
bun test:watch

# Coverage report
bun test:coverage

# Run specific tests
bun test:health                        # Health check tests only
bun test tests/specific-test.test.ts   # Single test file
```

### Database Operations

Database scripts use `dotenv-cli` to load `server/.env` for `DATABASE_URL`.

```bash
# Create database schema
bun db:create

# Seed database with sample data
bun db:seed

# Fresh database (drop, create, seed)
bun db:fresh

# Drop all tables (CASCADE)
bun db:drop

# Run custom SQL file
bun db:run -- path/to/file.sql
```

**Schema Details** (`db/schema.sql`):
- UUID extension enabled
- Users and items tables with foreign keys
- Performance indexes on common queries
- Auto-updating `updated_at` triggers
- Cascade delete constraints

## 🎨 Path Aliases

The project uses TypeScript path aliases for clean imports. **Important**: Client aliases require updates in BOTH `tsconfig.app.json` AND `vite.config.ts`.

### Server (server/tsconfig.json)
```typescript
import { User } from '@shared/types'        // Shared types
import { db } from '@server/utils/db'       // Server modules
```

**Configuration:**
- `@server/*` → `server/src/*`
- `@shared/*` → `packages/shared/src/*`

### Client (client/tsconfig.app.json + vite.config.ts)
```typescript
import { User } from '@shared/types'        // Shared types
import { api } from '@/utils/api'           // Client modules
```

**Configuration:**
- `@/*` → `client/src/*`
- `@shared/*` → `packages/shared/src/*`

**⚠️ Critical**: When adding new client aliases, update both TypeScript config AND Vite alias configuration.

## 🎨 Styling with Tailwind CSS

The client uses **Tailwind CSS 4** with the official Vite plugin for optimal performance and modern features.

### Setup
```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css
/* src/index.css */
@import "tailwindcss";
```

### Class Sorting
Biome.js automatically sorts Tailwind classes using the `useSortedClasses` rule:

```bash
# Tailwind class sorting is included in standard workflows:
bun check:fix       # Auto-sorts Tailwind classes
bun check:all:fix   # Type check + auto-sort Tailwind classes
bun run precommit   # Full workflow with Tailwind sorting + tests

# Manual sorting (if needed):
bunx biome check --write --unsafe src/

# Configured for: className, class, classList attributes
# Also works in: clsx(), cva(), tw(), cn() functions
```

### TypeScript Configuration
TypeScript 5.9+ with `moduleResolution: "bundler"` allows path aliases **without** the deprecated `baseUrl`:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../packages/shared/src/*"]
    }
  }
}
```

This configuration is TypeScript 7.0+ compatible and eliminates deprecation warnings.

## 📦 Workspace Packages

### `@monorepo/server`
Hono-based backend server with:
- TypeScript support with ESNext target
- CORS configuration for frontend
- Path aliases (@server, @shared)
- Hot reload in development (`bun run --hot`)
- In-memory mock database with seed data (demo user + sample items)
- Optimized Docker build
- Entry point: `server/src/index.ts`

**Mock Database & Seed Data:**

The server uses an in-memory repository layer (`server/src/lib/db.ts`) with seed data auto-loaded on startup. This provides working CRUD endpoints out of the box without requiring PostgreSQL for local development. The repository interface is designed for easy swap to a real database (Drizzle, Prisma, or raw SQL).

> **Note**: In-memory data resets on every server restart. Connect PostgreSQL for persistent storage in production.

### `@monorepo/client`
React + Vite frontend with:
- React 19 with TypeScript 5.9
- **Tailwind CSS 4** with @tailwindcss/vite plugin
- Component-based architecture with `components/` and `pages/` folders
- Layout system with Header, Footer, and Layout components
- Path aliases (@, @shared) - no `baseUrl` required with `moduleResolution: "bundler"`
- Vite dev server with API proxy
- Nginx configuration for production
- Optimized Docker build
- Entry point: `client/src/main.tsx`
- Runtime environment variable injection via `config.js`

**Client Architecture:**

The client follows a modern component-based architecture with clear separation of concerns:

```
client/src/
├── components/          # Reusable UI components
│   └── layout/         # Layout components used across pages
│       ├── Header.tsx  # Site header with branding
│       ├── Footer.tsx  # Site footer with version info
│       ├── Layout.tsx  # Main layout wrapper
│       └── index.ts    # Barrel exports
├── pages/              # Page-level components
│   ├── Home.tsx        # Home page with API data display
│   └── index.ts        # Barrel exports
├── api/                # API client layer
│   └── items.ts        # Items API endpoints
├── assets/             # Static assets
│   └── react.svg       # React logo
├── App.tsx             # Root component (wraps pages in Layout)
├── App.css             # Global app styles
├── main.tsx            # Application entry point
├── config.ts           # Runtime configuration loader
└── index.css           # Global styles with Tailwind imports
```

**Component Organization:**
- `components/` - Shared, reusable components used across multiple pages
- `pages/` - Top-level route components representing full pages
- `api/` - Backend communication layer with typed API functions
- Barrel exports (`index.ts`) for clean imports: `import {Layout} from '@/components/layout'`

### `@monorepo/shared`
Shared code between server and client:
- **types/index.ts**: Domain models (User, Item) and API contracts (ApiResponse<T>)
- **utils/index.ts**: Shared utilities (formatDate, validateEmail)

**Workflow**: Define types in `packages/shared/src/types/index.ts`, export via `packages/shared/src/index.ts`, import in both server and client using `@shared/*` alias.

**Note**: Exports `.ts` source files directly (no build step), consumers handle transpilation.

## 🔧 Adding Dependencies

Use Bun's workspace filtering:

```bash
# Add to specific workspace
bun add <package> --filter @monorepo/server
bun add <package> --filter @monorepo/client
bun add <package> --filter @monorepo/shared

# Add dev dependency to root (e.g., tooling)
bun add -d <package>
```

## 🐳 Docker Deployment

This template uses **GitHub Container Registry (GHCR)** for Docker images. The deployment architecture:

1. **PostgreSQL**: Managed separately (local install, managed service, or separate container)
2. **Application Services**: Server + Client deployed via docker-compose
3. **Workflow**: Build locally → Push to GHCR → Pull and deploy on VPS

**Important**: `docker-compose.yml` only manages application services (server + client). PostgreSQL must be set up independently and accessed via `DATABASE_URL`.

See [DOCKER.md](./DOCKER.md) for comprehensive deployment guide.

### ☸️ Kubernetes Deployment

For production Kubernetes deployments, see [KUBERNETES.md](./KUBERNETES.md) for:
- Complete Kubernetes manifests (deployments, services, configmaps, secrets, ingress)
- 40+ Makefile commands for K8s management
- Deployment, scaling, monitoring, and troubleshooting guides

### Building and Pushing Images

**Prerequisites:**

**Option 1: Use .env.build file (Recommended)**
```bash
# Copy and edit the build environment template
cp .env.build.example .env.build

# Edit .env.build with your values
# Set GITHUB_USER, GITHUB_TOKEN, VITE_API_URL, etc.

# Load variables
source .env.build

# Build and push
make deploy
```

**Option 2: Export variables manually**
```bash
# Set up GitHub credentials
export GITHUB_USER=your-github-username
export GITHUB_TOKEN=ghp_your_personal_access_token

# Optional: Set image version (defaults to 'latest')
export IMAGE_VERSION=v1.0.0
```

**✨ Note: Runtime Configuration**

The client now uses **runtime configuration** for `VITE_API_URL`, which means you don't need to set it at build time. Simply configure it in `.env.production` on your VPS, and restart the container to apply changes - no rebuild required!

**Build and Push:**
```bash
# Full deployment workflow (login + build + push)
make deploy

# Or step by step
make login          # Login to GitHub Container Registry
make build-all      # Build server + client images
make push-all       # Push both images to GHCR

# Individual operations
make build-server   # Build only server image
make build-client   # Build only client image
make push-server    # Push only server image
make push-client    # Push only client image

# View image information
make info

# Clean up local images
make clean
```

**Updating API URL (Runtime Configuration):**

To change `VITE_API_URL` after deployment, simply update `.env.production` on your VPS and restart the container:

```bash
# On VPS: Edit .env.production
nano .env.production
# Update VITE_API_URL=https://new-api-domain.com

# Restart client container to apply changes
docker compose --env-file .env.production up -d client

# No rebuild or pull needed!
```

**Images are pushed to:**
- Server: `ghcr.io/{GITHUB_USER}/bun-hono-react-monorepo-server:latest`
- Client: `ghcr.io/{GITHUB_USER}/bun-hono-react-monorepo-client:latest`

### Deploying on VPS

**Step 1: Set Up PostgreSQL on VPS**

PostgreSQL is managed independently from docker-compose. Choose one option:

**Option A: Install PostgreSQL Locally on VPS**
```bash
# Install PostgreSQL 16
sudo apt update
sudo apt install postgresql-16 postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE app_db;
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE app_db TO your_user;
\q

# Apply schema
psql -U your_user -d app_db -f db/schema.sql
psql -U your_user -d app_db -f db/seed.sql
```

**Option B: Use Managed Database Service**
- Use DigitalOcean Managed Databases, AWS RDS, Supabase, or similar
- Create database and apply schema using provided connection string

**Option C: Run PostgreSQL in Separate Docker Container**
```bash
docker run -d \
  --name postgres \
  --restart unless-stopped \
  -e POSTGRES_USER=your_user \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=app_db \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine
```

**Step 2: Prepare Application Files**
```bash
# Copy required files to VPS
scp .env.production your-vps:/path/to/deploy/
scp docker-compose.yml your-vps:/path/to/deploy/
```

**Step 3: Configure `.env.production` on VPS**
```bash
# Update these values
GITHUB_USER=your-github-username
DATABASE_URL=postgresql://user:password@localhost:5432/app_db
VITE_API_URL=http://your-domain.com:3000
```

**Step 4: Deploy Application Services**
```bash
# SSH into VPS
ssh your-vps

# Navigate to deploy directory
cd /path/to/deploy

# Pull latest images and start services
docker compose --env-file .env.production pull
docker compose --env-file .env.production up -d

# View logs
docker compose --env-file .env.production logs -f

# Check status
docker compose --env-file .env.production ps
```

### Environment Files

**✨ Runtime Configuration**

All application environment variables are now **runtime configurable**, meaning you can update `.env.production` on your VPS and restart containers without rebuilding images.

**Runtime Variables** (read when container starts):
- `VITE_API_URL` - Client API endpoint (runtime injected via entrypoint script)
- `DATABASE_URL` - Server database connection
- `SERVER_PORT`, `CLIENT_PORT` - Port configuration
- Can be changed in `.env.production` and applied with container restart

**File Organization:**

- **Development**:
  - `server/.env` → Server variables (DATABASE_URL, PORT)
  - `client/.env` → Client variables (VITE_API_URL)
  - `client/public/config.js` → Development placeholder (prevents 404 errors)

- **Production**:
  - `.env.production` → Runtime configuration for docker-compose
    - External PostgreSQL connection (DATABASE_URL)
    - Image registry settings (GHCR)
    - Server/client ports
    - Container names
  - `/usr/share/nginx/html/config.js` → Generated at container startup by `docker-entrypoint.sh`

- **Build Time** (local machine):
  - Export credentials for image registry:
    ```bash
    export GITHUB_USER=your-username
    export GITHUB_TOKEN=ghp_token
    ```

**Runtime Configuration Setup:**

The client uses a dual-configuration system for seamless development and production:

1. **Development Mode** (`bun dev`):
   - `client/public/config.js` serves as a placeholder to prevent 404 errors
   - App reads configuration from `client/.env` via `import.meta.env.VITE_API_URL`
   - Fallback: `http://localhost:3000` if env var not set

2. **Production Mode** (Docker):
   - `docker-entrypoint.sh` generates `config.js` with runtime values at container startup
   - App reads `window.__RUNTIME_CONFIG__.VITE_API_URL` from generated config.js
   - Change API URL by updating `.env.production` and restarting container (no rebuild needed)

**Configuration Priority** (`client/src/config.ts`):
```
1. window.__RUNTIME_CONFIG__ (production - injected at runtime)
   ↓
2. import.meta.env.VITE_API_URL (development - from .env file)
   ↓
3. http://localhost:3000 (default fallback)
```

**Note**: PostgreSQL is not managed by docker-compose. Set `DATABASE_URL` to point to your external PostgreSQL instance (local VPS install, managed service, or separate container).

### Docker Commands Reference

```bash
# Start services
docker compose --env-file .env.production up -d

# Stop services
docker compose --env-file .env.production down

# View logs
docker compose --env-file .env.production logs -f

# Restart specific service
docker compose --env-file .env.production restart server

# Update to latest images
docker compose --env-file .env.production pull
docker compose --env-file .env.production up -d
```

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
- **Turborepo**: Monorepo build system with caching
- **tsgo**: Native TypeScript compiler for fast type checking
- **Biome.js 2.2.7**: Linter and formatter

### DevOps
- **Docker**: Containerization
- **Nginx**: Web server for production
- **docker-compose**: Multi-container orchestration

## 🏗️ Advanced Configuration

### Turborepo Task Configuration

Configured in `turbo.json`:
- `build`: Depends on `^build` (workspace dependencies), outputs to `dist/**`, cached
- `dev`: No cache, persistent tasks
- `typecheck`, `lint`, `check`: Depend on `^build`

### TypeScript Configuration

- **Root**: `tsconfig.json` for workspace-level type checking
- **Server**: `server/tsconfig.json` with ESNext target, bundler resolution, strict mode
- **Client**: Project references pattern (`tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`)
  - `tsconfig.app.json`: React JSX, DOM libs, strict linting (noUnusedLocals, noUnusedParameters)
- **Shared**: `packages/shared/tsconfig.json` exports TypeScript source directly

### Important Conventions

- **API Response Contract**: All API endpoints use `ApiResponse<T>` type from `@shared/types`
- **Database Triggers**: `updated_at` columns auto-update via PostgreSQL triggers
- **Shared Package**: Exports `.ts` files directly (not compiled), consumers handle transpilation
- **Client Aliases**: Require updates in both `tsconfig.app.json` AND `vite.config.ts`

## 📚 Documentation

- [ENV_VARS.md](./ENV_VARS.md) - **Complete environment variables reference**
- [TEMPLATE.md](./TEMPLATE.md) - How to use this as a project template
- [DOCKER.md](./DOCKER.md) - Docker deployment guide
- [KUBERNETES.md](./KUBERNETES.md) - Kubernetes deployment guide
- [QUICK_START.md](./QUICK_START.md) - Quick reference guide

## 🤝 Contributing

This is a template repository. Feel free to fork it and customize it for your needs. If you have improvements that would benefit the template itself, pull requests are welcome!

## 📄 License

MIT License - feel free to use this template for any purpose.

## ⭐ Support

If you find this template useful, please give it a star on GitHub!

---

**Happy Building!** 🚀

Made with ❤️ using Bun, Hono, and React
