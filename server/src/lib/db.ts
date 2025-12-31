/**
 * Database Layer (Mock Implementation)
 *
 * This provides a repository abstraction for database operations.
 * Replace the mock implementations with real database queries
 * (e.g., using Drizzle, Prisma, or raw PostgreSQL via pg/postgres).
 *
 * The interface remains the same, making it easy to swap implementations.
 */

import type {
  Item,
  ItemId,
  ItemStatus,
  OAuthAccount,
  OAuthAccountId,
  OAuthProvider,
  Session,
  SessionId,
  User,
  UserId,
  UserRole,
} from '@shared/types'
import {UserRole as UserRoleConst} from '@shared/types'
import {generateItemId, generateOAuthAccountId, generateSessionId, generateUserId} from './typeid'

// ============================================================================
// In-Memory Storage (Replace with real DB in production)
// ============================================================================

interface StoredUser extends User {
  passwordHash: string | null
}

const users = new Map<UserId, StoredUser>()
const usersByEmail = new Map<string, UserId>()
const sessions = new Map<SessionId, Session>()
const oauthAccounts = new Map<OAuthAccountId, OAuthAccount>()
const oauthByProvider = new Map<string, OAuthAccountId>() // provider:providerId -> id
const items = new Map<ItemId, Item>()

// ============================================================================
// User Repository
// ============================================================================

export const userRepository = {
  /**
   * Create a new user
   */
  async create(data: {
    email: string
    name: string
    passwordHash: string | null
    role?: UserRole
    emailVerified?: boolean
    avatarUrl?: string
  }): Promise<User> {
    const id = generateUserId()
    const now = new Date()

    const user: StoredUser = {
      id,
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role || UserRoleConst.USER,
      emailVerified: data.emailVerified || false,
      avatarUrl: data.avatarUrl,
      createdAt: now,
      updatedAt: now,
    }

    users.set(id, user)
    usersByEmail.set(user.email, id)

    // Return user without password hash
    const {passwordHash: _, ...publicUser} = user
    return publicUser
  },

  /**
   * Find user by ID
   */
  async findById(id: UserId): Promise<User | null> {
    const user = users.get(id)
    if (!user) return null

    const {passwordHash: _, ...publicUser} = user
    return publicUser
  },

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const id = usersByEmail.get(email.toLowerCase())
    if (!id) return null

    return this.findById(id)
  },

  /**
   * Find user by email with password hash (for authentication)
   */
  async findByEmailWithPassword(email: string): Promise<{user: User; passwordHash: string | null} | null> {
    const id = usersByEmail.get(email.toLowerCase())
    if (!id) return null

    const stored = users.get(id)
    if (!stored) return null

    const {passwordHash, ...user} = stored
    return {user, passwordHash}
  },

  /**
   * Update user
   */
  async update(
    id: UserId,
    data: Partial<{
      name: string
      avatarUrl: string
      role: UserRole
      emailVerified: boolean
    }>
  ): Promise<User | null> {
    const user = users.get(id)
    if (!user) return null

    const updated: StoredUser = {
      ...user,
      ...data,
      updatedAt: new Date(),
    }
    users.set(id, updated)

    const {passwordHash: _, ...publicUser} = updated
    return publicUser
  },

  /**
   * Check if email is already registered
   */
  async emailExists(email: string): Promise<boolean> {
    return usersByEmail.has(email.toLowerCase())
  },
}

// ============================================================================
// Session Repository
// ============================================================================

export const sessionRepository = {
  /**
   * Create a new session
   */
  async create(data: {userId: UserId; expiresAt: Date; userAgent?: string; ipAddress?: string}): Promise<Session> {
    const id = generateSessionId()
    const now = new Date()

    const session: Session = {
      id,
      userId: data.userId,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      expiresAt: data.expiresAt,
      createdAt: now,
    }

    sessions.set(id, session)
    return session
  },

  /**
   * Find session by ID
   */
  async findById(id: SessionId): Promise<Session | null> {
    return sessions.get(id) || null
  },

  /**
   * Find all sessions for a user
   */
  async findByUserId(userId: UserId): Promise<Session[]> {
    return Array.from(sessions.values()).filter((s) => s.userId === userId)
  },

  /**
   * Delete a session
   */
  async delete(id: SessionId): Promise<boolean> {
    return sessions.delete(id)
  },

  /**
   * Delete all sessions for a user
   */
  async deleteByUserId(userId: UserId): Promise<number> {
    let count = 0
    for (const [id, session] of sessions) {
      if (session.userId === userId) {
        sessions.delete(id)
        count++
      }
    }
    return count
  },

  /**
   * Delete expired sessions
   */
  async deleteExpired(): Promise<number> {
    const now = new Date()
    let count = 0
    for (const [id, session] of sessions) {
      if (session.expiresAt < now) {
        sessions.delete(id)
        count++
      }
    }
    return count
  },
}

// ============================================================================
// OAuth Account Repository
// ============================================================================

export const oauthAccountRepository = {
  /**
   * Create or update OAuth account
   */
  async upsert(data: {
    userId: UserId
    provider: OAuthProvider
    providerAccountId: string
    accessToken?: string
    refreshToken?: string
    expiresAt?: Date
  }): Promise<OAuthAccount> {
    const providerKey = `${data.provider}:${data.providerAccountId}`
    const existingId = oauthByProvider.get(providerKey)
    const now = new Date()

    if (existingId) {
      const existing = oauthAccounts.get(existingId)
      if (existing) {
        const updated: OAuthAccount = {
          ...existing,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
          updatedAt: now,
        }
        oauthAccounts.set(existingId, updated)
        return updated
      }
    }

    const id = generateOAuthAccountId()
    const account: OAuthAccount = {
      id,
      userId: data.userId,
      provider: data.provider,
      providerAccountId: data.providerAccountId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
      createdAt: now,
      updatedAt: now,
    }

    oauthAccounts.set(id, account)
    oauthByProvider.set(providerKey, id)
    return account
  },

  /**
   * Find OAuth account by provider and provider ID
   */
  async findByProvider(provider: OAuthProvider, providerAccountId: string): Promise<OAuthAccount | null> {
    const providerKey = `${provider}:${providerAccountId}`
    const id = oauthByProvider.get(providerKey)
    if (!id) return null

    return oauthAccounts.get(id) || null
  },

  /**
   * Find all OAuth accounts for a user
   */
  async findByUserId(userId: UserId): Promise<OAuthAccount[]> {
    return Array.from(oauthAccounts.values()).filter((a) => a.userId === userId)
  },

  /**
   * Delete OAuth account
   */
  async delete(id: OAuthAccountId): Promise<boolean> {
    const account = oauthAccounts.get(id)
    if (account) {
      oauthByProvider.delete(`${account.provider}:${account.providerAccountId}`)
    }
    return oauthAccounts.delete(id)
  },
}

// ============================================================================
// Item Repository
// ============================================================================

export const itemRepository = {
  /**
   * Create a new item
   */
  async create(data: {userId: UserId; title: string; description: string; status?: ItemStatus}): Promise<Item> {
    const id = generateItemId()
    const now = new Date()

    const item: Item = {
      id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      status: data.status || 'active',
      createdAt: now,
      updatedAt: now,
    }

    items.set(id, item)
    return item
  },

  /**
   * Find item by ID
   */
  async findById(id: ItemId): Promise<Item | null> {
    return items.get(id) || null
  },

  /**
   * Find all items for a user
   */
  async findByUserId(userId: UserId): Promise<Item[]> {
    return Array.from(items.values()).filter((i) => i.userId === userId)
  },

  /**
   * Find all items
   */
  async findAll(): Promise<Item[]> {
    return Array.from(items.values())
  },

  /**
   * Update item
   */
  async update(
    id: ItemId,
    data: Partial<{
      title: string
      description: string
      status: ItemStatus
    }>
  ): Promise<Item | null> {
    const item = items.get(id)
    if (!item) return null

    const updated: Item = {
      ...item,
      ...data,
      updatedAt: new Date(),
    }
    items.set(id, updated)
    return updated
  },

  /**
   * Delete item
   */
  async delete(id: ItemId): Promise<boolean> {
    return items.delete(id)
  },
}
