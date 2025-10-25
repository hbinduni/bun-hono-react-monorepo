# Client Dockerfile
FROM oven/bun:1.3.0-slim AS base
WORKDIR /app

# Install dependencies
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

# Build client
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY --from=shared-builder /app/packages/shared ./packages/shared
COPY package.json ./
COPY client ./client
COPY tsconfig.json ./
WORKDIR /app/client
RUN bun run build

# Production image with nginx
FROM nginx:alpine AS runner

# Copy built files
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy and set up entrypoint script for runtime config injection
COPY client/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

# Use entrypoint script to generate runtime config before starting nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
