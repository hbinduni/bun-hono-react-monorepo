/**
 * Authentication Routes
 *
 * Handles user registration, login, token refresh, and logout.
 * Uses JWT for stateless authentication with refresh token rotation.
 */

import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  SessionId,
  User,
} from '@shared/types'
import {Hono} from 'hono'
import {HTTPException} from 'hono/http-exception'
import {
  generateTokenPair,
  getRefreshTokenExpiry,
  hashPassword,
  isCommonPassword,
  validatePassword,
  verifyPassword,
  verifyRefreshToken,
} from '../lib'
import {sessionRepository, userRepository} from '../lib/db'
import {type AuthVariables, requireAuth} from '../middleware'

// ============================================================================
// Auth Router
// ============================================================================

const auth = new Hono<{Variables: AuthVariables}>()

// ============================================================================
// POST /api/auth/register - Create new user account
// ============================================================================

auth.post('/register', async (c) => {
  const body = await c.req.json<RegisterRequest>()

  // Validate required fields
  if (!body.email || !body.password || !body.name) {
    throw new HTTPException(400, {
      message: 'Email, password, and name are required',
    })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(body.email)) {
    throw new HTTPException(400, {
      message: 'Invalid email format',
    })
  }

  // Validate password strength
  const passwordValidation = validatePassword(body.password)
  if (!passwordValidation.valid) {
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Password does not meet requirements',
        message: passwordValidation.errors.join('; '),
      },
      400
    )
  }

  // Check for common passwords
  if (isCommonPassword(body.password)) {
    throw new HTTPException(400, {
      message: 'Password is too common. Please choose a stronger password.',
    })
  }

  // Check if email already exists
  const existingUser = await userRepository.emailExists(body.email)
  if (existingUser) {
    throw new HTTPException(409, {
      message: 'An account with this email already exists',
    })
  }

  // Hash password and create user
  const passwordHash = await hashPassword(body.password)
  const user = await userRepository.create({
    email: body.email,
    name: body.name.trim(),
    passwordHash,
    emailVerified: false,
  })

  // Generate tokens
  const tokens = await generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  // Create session for refresh token
  await sessionRepository.create({
    userId: user.id,
    expiresAt: getRefreshTokenExpiry(),
    userAgent: c.req.header('User-Agent'),
    ipAddress: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'),
  })

  return c.json<ApiResponse<AuthResponse>>(
    {
      success: true,
      data: {
        user,
        ...tokens,
      },
      message: 'Account created successfully',
    },
    201
  )
})

// ============================================================================
// POST /api/auth/login - Authenticate user
// ============================================================================

auth.post('/login', async (c) => {
  const body = await c.req.json<LoginRequest>()

  // Validate required fields
  if (!body.email || !body.password) {
    throw new HTTPException(400, {
      message: 'Email and password are required',
    })
  }

  // Find user by email
  const result = await userRepository.findByEmailWithPassword(body.email)

  // Constant-time-ish response (don't reveal if email exists)
  if (!result || !result.passwordHash) {
    // Hash a dummy password to prevent timing attacks
    await verifyPassword(body.password, '$2a$12$dummy.hash.to.prevent.timing.attacks')
    throw new HTTPException(401, {
      message: 'Invalid email or password',
    })
  }

  // Verify password
  const isValid = await verifyPassword(body.password, result.passwordHash)
  if (!isValid) {
    throw new HTTPException(401, {
      message: 'Invalid email or password',
    })
  }

  const {user} = result

  // Generate tokens
  const tokens = await generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  // Create session for refresh token
  await sessionRepository.create({
    userId: user.id,
    expiresAt: getRefreshTokenExpiry(),
    userAgent: c.req.header('User-Agent'),
    ipAddress: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'),
  })

  return c.json<ApiResponse<AuthResponse>>({
    success: true,
    data: {
      user,
      ...tokens,
    },
  })
})

// ============================================================================
// POST /api/auth/refresh - Refresh access token
// ============================================================================

auth.post('/refresh', async (c) => {
  const body = await c.req.json<RefreshTokenRequest>()

  if (!body.refreshToken) {
    throw new HTTPException(400, {
      message: 'Refresh token is required',
    })
  }

  try {
    // Verify refresh token
    const payload = await verifyRefreshToken(body.refreshToken)

    // Find user
    const user = await userRepository.findById(payload.sub)
    if (!user) {
      throw new HTTPException(401, {
        message: 'User not found',
      })
    }

    // Generate new token pair (token rotation for security)
    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return c.json<ApiResponse<RefreshTokenResponse>>({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
    })
  } catch {
    throw new HTTPException(401, {
      message: 'Invalid or expired refresh token',
    })
  }
})

// ============================================================================
// POST /api/auth/logout - Invalidate session
// ============================================================================

auth.post('/logout', requireAuth(), async (c) => {
  const user = c.get('user')

  // Delete all sessions for this user (logout from all devices)
  await sessionRepository.deleteByUserId(user.sub)

  return c.json<ApiResponse<null>>({
    success: true,
    message: 'Logged out successfully',
  })
})

// ============================================================================
// GET /api/auth/me - Get current user
// ============================================================================

auth.get('/me', requireAuth(), async (c) => {
  const jwtUser = c.get('user')

  const user = await userRepository.findById(jwtUser.sub)
  if (!user) {
    throw new HTTPException(404, {
      message: 'User not found',
    })
  }

  return c.json<ApiResponse<User>>({
    success: true,
    data: user,
  })
})

// ============================================================================
// GET /api/auth/sessions - Get active sessions
// ============================================================================

auth.get('/sessions', requireAuth(), async (c) => {
  const user = c.get('user')

  const userSessions = await sessionRepository.findByUserId(user.sub)

  return c.json<ApiResponse<typeof userSessions>>({
    success: true,
    data: userSessions,
  })
})

// ============================================================================
// DELETE /api/auth/sessions/:id - Revoke specific session
// ============================================================================

auth.delete('/sessions/:id', requireAuth(), async (c) => {
  const user = c.get('user')
  const sessionId = c.req.param('id')

  const session = await sessionRepository.findById(sessionId as SessionId)

  if (!session) {
    throw new HTTPException(404, {
      message: 'Session not found',
    })
  }

  // Only allow deleting own sessions (unless admin)
  if (session.userId !== user.sub && user.role !== 'admin') {
    throw new HTTPException(403, {
      message: "Cannot revoke another user's session",
    })
  }

  await sessionRepository.delete(session.id)

  return c.json<ApiResponse<null>>({
    success: true,
    message: 'Session revoked',
  })
})

export default auth
