/**
 * TypeID Utilities
 *
 * TypeIDs are type-safe, K-sortable unique identifiers based on UUIDv7.
 * Format: {prefix}_{26-char-base32-suffix}
 * Example: user_01h2xcejqtf2nbrexx3vqjhp41
 */

import type {ItemId, OAuthAccountId, SessionId, UserId} from '@shared/types'
import {TypeIdPrefixes} from '@shared/types'
import {typeid} from 'typeid-js'

// ============================================================================
// TypeID Generation Functions
// ============================================================================

/**
 * Generate a new User TypeID
 * @returns TypeID string with 'user' prefix
 */
export function generateUserId(): UserId {
  return typeid(TypeIdPrefixes.USER).toString() as UserId
}

/**
 * Generate a new Item TypeID
 * @returns TypeID string with 'item' prefix
 */
export function generateItemId(): ItemId {
  return typeid(TypeIdPrefixes.ITEM).toString() as ItemId
}

/**
 * Generate a new Session TypeID
 * @returns TypeID string with 'sess' prefix
 */
export function generateSessionId(): SessionId {
  return typeid(TypeIdPrefixes.SESSION).toString() as SessionId
}

/**
 * Generate a new OAuth Account TypeID
 * @returns TypeID string with 'oauth' prefix
 */
export function generateOAuthAccountId(): OAuthAccountId {
  return typeid(TypeIdPrefixes.OAUTH_ACCOUNT).toString() as OAuthAccountId
}

// ============================================================================
// TypeID Validation Functions
// ============================================================================

/** TypeID format regex: prefix_26chars */
const TYPEID_REGEX = /^[a-z]+_[0-9a-hjkmnp-tv-z]{26}$/

/**
 * Validate that a string is a valid TypeID format
 * @param id - String to validate
 * @returns true if valid TypeID format
 */
export function isValidTypeId(id: string): boolean {
  return TYPEID_REGEX.test(id)
}

/**
 * Validate that a string is a valid User TypeID
 * @param id - String to validate
 * @returns true if valid User TypeID
 */
export function isValidUserId(id: string): id is UserId {
  return id.startsWith(`${TypeIdPrefixes.USER}_`) && isValidTypeId(id)
}

/**
 * Validate that a string is a valid Item TypeID
 * @param id - String to validate
 * @returns true if valid Item TypeID
 */
export function isValidItemId(id: string): id is ItemId {
  return id.startsWith(`${TypeIdPrefixes.ITEM}_`) && isValidTypeId(id)
}

/**
 * Validate that a string is a valid Session TypeID
 * @param id - String to validate
 * @returns true if valid Session TypeID
 */
export function isValidSessionId(id: string): id is SessionId {
  return id.startsWith(`${TypeIdPrefixes.SESSION}_`) && isValidTypeId(id)
}

/**
 * Validate that a string is a valid OAuth Account TypeID
 * @param id - String to validate
 * @returns true if valid OAuth Account TypeID
 */
export function isValidOAuthAccountId(id: string): id is OAuthAccountId {
  return id.startsWith(`${TypeIdPrefixes.OAUTH_ACCOUNT}_`) && isValidTypeId(id)
}

// ============================================================================
// TypeID Parsing Functions
// ============================================================================

/**
 * Extract the prefix from a TypeID
 * @param id - TypeID string
 * @returns The prefix portion of the TypeID
 */
export function getTypeIdPrefix(id: string): string {
  const underscoreIndex = id.lastIndexOf('_')
  return underscoreIndex > 0 ? id.slice(0, underscoreIndex) : ''
}

/**
 * Extract the suffix (encoded UUID) from a TypeID
 * @param id - TypeID string
 * @returns The suffix portion of the TypeID
 */
export function getTypeIdSuffix(id: string): string {
  const underscoreIndex = id.lastIndexOf('_')
  return underscoreIndex > 0 ? id.slice(underscoreIndex + 1) : id
}
