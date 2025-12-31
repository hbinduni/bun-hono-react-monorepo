/**
 * Library exports
 * Barrel file for all utility functions
 */

export type {ServerConfig} from './config'
// Configuration
export {getConfig, isDevelopment, isOAuthConfigured, isProduction} from './config'
export type {TokenPayload, VerifiedToken} from './jwt'
// JWT utilities
export {
  extractBearerToken,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  getRefreshTokenExpiry,
  verifyAccessToken,
  verifyRefreshToken,
  verifyToken,
} from './jwt'
export type {PasswordValidationResult} from './password'
// Password utilities
export {
  hashPassword,
  isCommonPassword,
  PASSWORD_REQUIREMENTS,
  validatePassword,
  verifyPassword,
} from './password'
// TypeID utilities
export {
  generateItemId,
  generateOAuthAccountId,
  generateSessionId,
  generateUserId,
  getTypeIdPrefix,
  getTypeIdSuffix,
  isValidItemId,
  isValidOAuthAccountId,
  isValidSessionId,
  isValidTypeId,
  isValidUserId,
} from './typeid'
