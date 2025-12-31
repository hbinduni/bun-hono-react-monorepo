/**
 * JWT Utilities using jose library
 *
 * Implements secure JWT signing and verification with:
 * - Short-lived access tokens (15 minutes)
 * - Longer-lived refresh tokens (7 days)
 * - HS256 algorithm with strong secret
 */

import type {JwtPayload, UserId, UserRole} from '@shared/types'
import {type JWTPayload, jwtVerify, SignJWT} from 'jose'
import {getConfig} from './config'

// ============================================================================
// Constants
// ============================================================================

const ACCESS_TOKEN_EXPIRY = '15m' // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d' // 7 days
const ALGORITHM = 'HS256'
const ISSUER = 'monorepo-api'
const AUDIENCE = 'monorepo-client'

// ============================================================================
// Secret Key Management
// ============================================================================

let secretKey: Uint8Array | null = null

/**
 * Get the JWT secret key as Uint8Array
 * Lazily initialized from environment
 */
function getSecretKey(): Uint8Array {
  if (!secretKey) {
    const config = getConfig()
    const secret = config.JWT_SECRET
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters')
    }
    secretKey = new TextEncoder().encode(secret)
  }
  return secretKey
}

// ============================================================================
// Token Generation
// ============================================================================

export interface TokenPayload {
  userId: UserId
  email: string
  role: UserRole
}

/**
 * Generate an access token for a user
 * Short-lived token for API authentication
 */
export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  return new SignJWT({
    sub: payload.userId,
    email: payload.email,
    role: payload.role,
    type: 'access',
  } satisfies Partial<JwtPayload>)
    .setProtectedHeader({alg: ALGORITHM})
    .setIssuedAt(now)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getSecretKey())
}

/**
 * Generate a refresh token for a user
 * Longer-lived token for obtaining new access tokens
 */
export async function generateRefreshToken(payload: TokenPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  return new SignJWT({
    sub: payload.userId,
    email: payload.email,
    role: payload.role,
    type: 'refresh',
  } satisfies Partial<JwtPayload>)
    .setProtectedHeader({alg: ALGORITHM})
    .setIssuedAt(now)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(getSecretKey())
}

/**
 * Generate both access and refresh tokens
 * @returns Object containing both tokens and expiry info
 */
export async function generateTokenPair(
  payload: TokenPayload
): Promise<{accessToken: string; refreshToken: string; expiresIn: number}> {
  const [accessToken, refreshToken] = await Promise.all([generateAccessToken(payload), generateRefreshToken(payload)])

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  }
}

// ============================================================================
// Token Verification
// ============================================================================

export interface VerifiedToken {
  payload: JwtPayload
  isExpired: boolean
}

/**
 * Verify and decode a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export async function verifyToken(token: string): Promise<JwtPayload> {
  const {payload} = await jwtVerify(token, getSecretKey(), {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: [ALGORITHM],
  })

  // Validate required claims
  if (!payload.sub || !payload.exp || !payload.iat) {
    throw new Error('Invalid token payload: missing required claims')
  }

  const jwtPayload = payload as unknown as JWTPayload & Partial<JwtPayload>

  return {
    sub: jwtPayload.sub as UserId,
    email: jwtPayload.email as string,
    role: jwtPayload.role as UserRole,
    type: jwtPayload.type as 'access' | 'refresh',
    iat: jwtPayload.iat as number,
    exp: jwtPayload.exp as number,
  }
}

/**
 * Verify an access token specifically
 * @throws Error if not an access token
 */
export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const payload = await verifyToken(token)
  if (payload.type !== 'access') {
    throw new Error('Invalid token type: expected access token')
  }
  return payload
}

/**
 * Verify a refresh token specifically
 * @throws Error if not a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  const payload = await verifyToken(token)
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type: expected refresh token')
  }
  return payload
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract token from Authorization header
 * Supports "Bearer <token>" format
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null
  }

  return parts[1]
}

/**
 * Calculate token expiration date
 */
export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
}
