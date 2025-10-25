# Server Dockerfile
FROM oven/bun:1.3.0-slim AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package.json bun.lock* ./
COPY server/package.json ./server/
COPY client/package.json ./client/
COPY packages/shared/package.json ./packages/shared/
RUN bun install --frozen-lockfile

# Build shared package
FROM base AS shared-builder
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
WORKDIR /app/packages/shared
RUN bun run typecheck

# Build server
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY --from=shared-builder /app/packages/shared ./packages/shared
COPY package.json ./
COPY server ./server
COPY tsconfig.json ./
WORKDIR /app/server
RUN bun run build

# Production image
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

WORKDIR /app

# Copy built files
COPY --from=builder --chown=hono:nodejs /app/server/dist ./dist
COPY --from=builder --chown=hono:nodejs /app/packages/shared ./packages/shared
COPY --from=deps --chown=hono:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=hono:nodejs /app/server/node_modules ./server/node_modules

USER hono

EXPOSE 3000

CMD ["bun", "run", "dist/index.js"]
