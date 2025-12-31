/**
 * Authentication Middleware for Hono
 *
 * Provides:
 * - JWT token validation middleware
 * - Role-based access control
 * - Request context enrichment with user data
 */

import type {JwtPayload, UserRole} from '@shared/types'
import type {Context, MiddlewareHandler} from 'hono'
import {HTTPException} from 'hono/http-exception'
import {extractBearerToken, verifyAccessToken} from '../lib/jwt'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Context variables added by auth middleware
 * Access via c.get('user') in route handlers
 */
export interface AuthVariables {
  user: JwtPayload
}

/**
 * Helper type for handlers that require authentication
 */
export type AuthContext = Context<{Variables: AuthVariables}>

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Middleware that requires valid JWT authentication
 * Adds user payload to context on success
 *
 * Usage:
 * ```ts
 * app.get('/api/protected', requireAuth(), (c) => {
 *   const user = c.get('user')
 *   return c.json({ userId: user.sub })
 * })
 * ```
 */
export function requireAuth(): MiddlewareHandler<{Variables: AuthVariables}> {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization')
    const token = extractBearerToken(authHeader)

    if (!token) {
      throw new HTTPException(401, {
        message: 'Authentication required',
      })
    }

    try {
      const payload = await verifyAccessToken(token)
      c.set('user', payload)
      await next()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid authentication token'

      throw new HTTPException(401, {
        message: `Authentication failed: ${message}`,
      })
    }
  }
}

/**
 * Optional authentication middleware
 * Validates token if present but doesn't require it
 * Useful for endpoints with different behavior for authenticated users
 */
export function optionalAuth(): MiddlewareHandler<{Variables: Partial<AuthVariables>}> {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization')
    const token = extractBearerToken(authHeader)

    if (token) {
      try {
        const payload = await verifyAccessToken(token)
        c.set('user', payload)
      } catch {
        // Invalid token in optional auth is ignored
        // Could log for monitoring purposes
      }
    }

    await next()
  }
}

// ============================================================================
// Role-Based Access Control
// ============================================================================

/**
 * Middleware that requires specific user role(s)
 * Must be used after requireAuth()
 *
 * Usage:
 * ```ts
 * app.delete('/api/admin/users/:id',
 *   requireAuth(),
 *   requireRole(['admin']),
 *   (c) => { ... }
 * )
 * ```
 */
export function requireRole(allowedRoles: UserRole[]): MiddlewareHandler<{Variables: AuthVariables}> {
  return async (c, next) => {
    const user = c.get('user')

    if (!user) {
      throw new HTTPException(401, {
        message: 'Authentication required',
      })
    }

    if (!allowedRoles.includes(user.role)) {
      throw new HTTPException(403, {
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      })
    }

    await next()
  }
}

/**
 * Convenience middleware for admin-only routes
 */
export function requireAdmin(): MiddlewareHandler<{Variables: AuthVariables}> {
  return requireRole(['admin'])
}

/**
 * Convenience middleware for moderator or admin routes
 */
export function requireModerator(): MiddlewareHandler<{Variables: AuthVariables}> {
  return requireRole(['admin', 'moderator'])
}

// ============================================================================
// Resource Ownership Check
// ============================================================================

/**
 * Check if the authenticated user owns a resource
 * @param resourceUserId - The user ID of the resource owner
 * @param c - Hono context with auth variables
 * @returns true if user owns the resource or is admin
 */
export function isResourceOwner(resourceUserId: string, c: AuthContext): boolean {
  const user = c.get('user')
  return user.sub === resourceUserId || user.role === 'admin'
}

/**
 * Throw 403 if user doesn't own the resource
 */
export function assertResourceOwner(resourceUserId: string, c: AuthContext): void {
  if (!isResourceOwner(resourceUserId, c)) {
    throw new HTTPException(403, {
      message: 'Access denied: you do not own this resource',
    })
  }
}
