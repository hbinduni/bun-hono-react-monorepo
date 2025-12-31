/**
 * Password Utilities
 *
 * Implements secure password hashing using bcrypt with:
 * - Cost factor of 12 (secure for 2024+)
 * - Constant-time comparison to prevent timing attacks
 */

import bcrypt from 'bcryptjs'

// ============================================================================
// Constants
// ============================================================================

/**
 * Bcrypt cost factor (work factor)
 * Higher = more secure but slower
 * 12 is recommended for 2024+
 */
const BCRYPT_ROUNDS = 12

/**
 * Password requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Optional for better UX
} as const

// ============================================================================
// Password Hashing
// ============================================================================

/**
 * Hash a plain-text password
 * @param password - Plain-text password to hash
 * @returns Bcrypt hash string (60 characters)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

/**
 * Verify a password against a hash
 * Uses constant-time comparison to prevent timing attacks
 * @param password - Plain-text password to verify
 * @param hash - Bcrypt hash to compare against
 * @returns true if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ============================================================================
// Password Validation
// ============================================================================

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate password against security requirements
 * @param password - Password to validate
 * @returns Validation result with errors if any
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must be at most ${PASSWORD_REQUIREMENTS.maxLength} characters`)
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if a password is commonly used (basic check)
 * In production, use a more comprehensive list
 */
const COMMON_PASSWORDS = new Set([
  'password',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'password123',
  'admin',
  'letmein',
  'welcome',
  'monkey',
])

export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase())
}
