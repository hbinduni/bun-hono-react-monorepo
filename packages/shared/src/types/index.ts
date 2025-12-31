// Shared TypeScript types between client and server

// ============================================================================
// TypeID Branded Types - Provides compile-time safety for different entity IDs
// ============================================================================

/** Brand symbol for nominal typing of IDs */
declare const __brand: unique symbol

/** Branded type helper for creating nominal ID types */
type Brand<T, B> = T & {[__brand]: B}

/** TypeID string for User entities (format: user_xxx...) */
export type UserId = Brand<string, 'UserId'>

/** TypeID string for Item entities (format: item_xxx...) */
export type ItemId = Brand<string, 'ItemId'>

/** TypeID string for Session entities (format: sess_xxx...) */
export type SessionId = Brand<string, 'SessionId'>

/** TypeID string for OAuth Account entities (format: oauth_xxx...) */
export type OAuthAccountId = Brand<string, 'OAuthAccountId'>

/** Helper type for all entity IDs */
export type EntityId = UserId | ItemId | SessionId | OAuthAccountId

// ============================================================================
// User Roles & Authentication
// ============================================================================

/** User role enumeration */
export const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

/** OAuth provider types */
export const OAuthProvider = {
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
} as const

export type OAuthProvider = (typeof OAuthProvider)[keyof typeof OAuthProvider]

/** Authentication method used for login */
export const AuthMethod = {
  EMAIL: 'email',
  OAUTH: 'oauth',
} as const

export type AuthMethod = (typeof AuthMethod)[keyof typeof AuthMethod]

// ============================================================================
// Core Entity Types
// ============================================================================

/** User entity - represents authenticated users */
export interface User {
  id: UserId
  email: string
  name: string
  role: UserRole
  emailVerified: boolean
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

/** Public user profile (safe to expose) */
export interface PublicUser {
  id: UserId
  name: string
  avatarUrl?: string
  createdAt: Date
}

/** Item entity - example resource owned by users */
export interface Item {
  id: ItemId
  userId: UserId
  title: string
  description: string
  status: ItemStatus
  createdAt: Date
  updatedAt: Date
}

export const ItemStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const

export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus]

/** OAuth account linking - connects OAuth providers to users */
export interface OAuthAccount {
  id: OAuthAccountId
  userId: UserId
  provider: OAuthProvider
  providerAccountId: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

/** User session for tracking active sessions */
export interface Session {
  id: SessionId
  userId: UserId
  userAgent?: string
  ipAddress?: string
  expiresAt: Date
  createdAt: Date
}

// ============================================================================
// Authentication Request/Response Types
// ============================================================================

/** Login request payload */
export interface LoginRequest {
  email: string
  password: string
}

/** Registration request payload */
export interface RegisterRequest {
  email: string
  password: string
  name: string
}

/** Authentication response with tokens */
export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/** Token refresh request */
export interface RefreshTokenRequest {
  refreshToken: string
}

/** Token refresh response */
export interface RefreshTokenResponse {
  accessToken: string
  expiresIn: number
}

/** OAuth authorization URL response */
export interface OAuthUrlResponse {
  url: string
  state: string
}

/** OAuth callback request (query params) */
export interface OAuthCallbackParams {
  code: string
  state: string
}

// ============================================================================
// JWT Types
// ============================================================================

/** JWT access token payload */
export interface JwtPayload {
  sub: UserId
  email: string
  role: UserRole
  type: 'access' | 'refresh'
  iat: number
  exp: number
}

// ============================================================================
// API Response Types
// ============================================================================

/** Standard API response wrapper */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/** Error response for API errors */
export interface ApiError {
  success: false
  error: string
  code?: string
  details?: Record<string, string[]>
}

// ============================================================================
// Type Guards & Helpers
// ============================================================================

/** Check if a value is a valid UserRole */
export function isUserRole(value: unknown): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole)
}

/** Check if a value is a valid OAuthProvider */
export function isOAuthProvider(value: unknown): value is OAuthProvider {
  return Object.values(OAuthProvider).includes(value as OAuthProvider)
}

/** Check if a value is a valid ItemStatus */
export function isItemStatus(value: unknown): value is ItemStatus {
  return Object.values(ItemStatus).includes(value as ItemStatus)
}

// ============================================================================
// TypeID Prefix Constants (for reference)
// ============================================================================

export const TypeIdPrefixes = {
  USER: 'user',
  ITEM: 'item',
  SESSION: 'sess',
  OAUTH_ACCOUNT: 'oauth',
} as const
