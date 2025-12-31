/**
 * Monorepo API Server
 *
 * Hono server with:
 * - JWT Authentication (email/password)
 * - OAuth Social Login (Google, Facebook, Twitter via Arctic)
 * - TypeID for type-safe entity identification
 * - Role-based access control
 */

import type {ApiResponse} from '@shared/types'
import {Hono} from 'hono'
import {cors} from 'hono/cors'
import {HTTPException} from 'hono/http-exception'
import {logger} from 'hono/logger'
import {getConfig, isDevelopment} from './lib'
import {authRoutes, itemsRoutes, oauthRoutes} from './routes'

// ============================================================================
// App Configuration
// ============================================================================

const app = new Hono()

// ============================================================================
// Global Middleware
// ============================================================================

// Request logging (development only)
if (isDevelopment()) {
  app.use('*', logger())
}

// CORS configuration
app.use(
  '*',
  cors({
    origin: (origin) => {
      const config = getConfig()
      // Allow frontend URL and localhost for development
      const allowedOrigins = [config.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
  })
)

// ============================================================================
// Global Error Handler
// ============================================================================

app.onError((err, c) => {
  console.error('Server error:', err)

  if (err instanceof HTTPException) {
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: err.message,
      },
      err.status
    )
  }

  // Unexpected error
  const isDev = isDevelopment()
  return c.json<ApiResponse<null>>(
    {
      success: false,
      error: isDev ? err.message : 'Internal server error',
    },
    500
  )
})

// 404 Handler
app.notFound((c) => {
  return c.json<ApiResponse<null>>(
    {
      success: false,
      error: `Route not found: ${c.req.method} ${c.req.path}`,
    },
    404
  )
})

// ============================================================================
// Health Check & API Info
// ============================================================================

app.get('/', (c) => {
  return c.json({
    name: 'Monorepo API',
    version: '2.0.0',
    stack: 'Hono + Bun',
    features: {
      authentication: 'JWT (email/password)',
      oauth: 'Google, Facebook, Twitter (via Arctic)',
      ids: 'TypeID (type-safe, K-sortable)',
      roles: 'admin, user, moderator',
    },
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
        sessions: 'GET /api/auth/sessions',
      },
      oauth: {
        providers: 'GET /api/auth/oauth/providers',
        google: 'GET /api/auth/oauth/google',
        facebook: 'GET /api/auth/oauth/facebook',
        twitter: 'GET /api/auth/oauth/twitter',
      },
      items: {
        list: 'GET /api/items',
        get: 'GET /api/items/:id',
        create: 'POST /api/items',
        update: 'PUT /api/items/:id',
        delete: 'DELETE /api/items/:id',
      },
    },
    docs: 'https://github.com/your-repo/docs',
  })
})

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// ============================================================================
// Mount Routes
// ============================================================================

// Authentication routes
app.route('/api/auth', authRoutes)

// OAuth routes (nested under /api/auth)
app.route('/api/auth/oauth', oauthRoutes)
app.route('/api/auth/callback', oauthRoutes) // OAuth callbacks

// Items API
app.route('/api/items', itemsRoutes)

// ============================================================================
// Server Export
// ============================================================================

const config = getConfig()

export default {
  port: config.PORT,
  fetch: app.fetch,
}
