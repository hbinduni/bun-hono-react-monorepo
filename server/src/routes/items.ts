/**
 * Items Routes
 *
 * Example CRUD routes demonstrating:
 * - TypeID for entity identification
 * - Authentication requirements
 * - Role-based access control
 * - Resource ownership validation
 */

import type {ApiResponse, Item, ItemId, ItemStatus, UserId} from '@shared/types'
import {isItemStatus} from '@shared/types'
import {Hono} from 'hono'
import {HTTPException} from 'hono/http-exception'
import {isValidItemId} from '../lib'
import {itemRepository} from '../lib/db'
import {
  type AuthContext,
  type AuthVariables,
  assertResourceOwner,
  optionalAuth,
  requireAdmin,
  requireAuth,
} from '../middleware'

// ============================================================================
// Items Router
// ============================================================================

const items = new Hono<{Variables: Partial<AuthVariables>}>()

// ============================================================================
// GET /api/items - List all items (public, with optional auth)
// ============================================================================

items.get('/', optionalAuth(), async (c) => {
  const user = c.get('user')

  let itemsList: Item[]

  if (user) {
    // Authenticated users see their own items
    itemsList = await itemRepository.findByUserId(user.sub)
  } else {
    // Public users see all items (you might want to change this)
    itemsList = await itemRepository.findAll()
  }

  return c.json<ApiResponse<Item[]>>({
    success: true,
    data: itemsList,
  })
})

// ============================================================================
// GET /api/items/:id - Get single item
// ============================================================================

items.get('/:id', optionalAuth(), async (c) => {
  const id = c.req.param('id')

  if (!isValidItemId(id)) {
    throw new HTTPException(400, {
      message: 'Invalid item ID format',
    })
  }

  const item = await itemRepository.findById(id as ItemId)

  if (!item) {
    throw new HTTPException(404, {
      message: 'Item not found',
    })
  }

  return c.json<ApiResponse<Item>>({
    success: true,
    data: item,
  })
})

// ============================================================================
// POST /api/items - Create new item (requires auth)
// ============================================================================

items.post('/', requireAuth(), async (c) => {
  const user = c.get('user')!
  const body = await c.req.json<{
    title?: string
    description?: string
    status?: ItemStatus
  }>()

  // Validate required fields
  if (!body.title?.trim()) {
    throw new HTTPException(400, {
      message: 'Title is required',
    })
  }

  // Validate status if provided
  if (body.status && !isItemStatus(body.status)) {
    throw new HTTPException(400, {
      message: 'Invalid status. Must be: active, completed, or archived',
    })
  }

  const item = await itemRepository.create({
    userId: user.sub,
    title: body.title.trim(),
    description: body.description?.trim() || '',
    status: body.status,
  })

  return c.json<ApiResponse<Item>>(
    {
      success: true,
      data: item,
      message: 'Item created successfully',
    },
    201
  )
})

// ============================================================================
// PUT /api/items/:id - Update item (requires auth + ownership)
// ============================================================================

items.put('/:id', requireAuth(), async (c) => {
  const id = c.req.param('id')

  if (!isValidItemId(id)) {
    throw new HTTPException(400, {
      message: 'Invalid item ID format',
    })
  }

  const item = await itemRepository.findById(id as ItemId)

  if (!item) {
    throw new HTTPException(404, {
      message: 'Item not found',
    })
  }

  // Check ownership (requireAuth ensures user exists)
  assertResourceOwner(item.userId, c as unknown as AuthContext)

  const body = await c.req.json<{
    title?: string
    description?: string
    status?: ItemStatus
  }>()

  // Validate status if provided
  if (body.status && !isItemStatus(body.status)) {
    throw new HTTPException(400, {
      message: 'Invalid status. Must be: active, completed, or archived',
    })
  }

  const updated = await itemRepository.update(id as ItemId, {
    title: body.title?.trim(),
    description: body.description?.trim(),
    status: body.status,
  })

  return c.json<ApiResponse<Item>>({
    success: true,
    data: updated!,
    message: 'Item updated successfully',
  })
})

// ============================================================================
// DELETE /api/items/:id - Delete item (requires auth + ownership)
// ============================================================================

items.delete('/:id', requireAuth(), async (c) => {
  const id = c.req.param('id')

  if (!isValidItemId(id)) {
    throw new HTTPException(400, {
      message: 'Invalid item ID format',
    })
  }

  const item = await itemRepository.findById(id as ItemId)

  if (!item) {
    throw new HTTPException(404, {
      message: 'Item not found',
    })
  }

  // Check ownership (requireAuth ensures user exists)
  assertResourceOwner(item.userId, c as unknown as AuthContext)

  await itemRepository.delete(id as ItemId)

  return c.json<ApiResponse<null>>({
    success: true,
    message: 'Item deleted successfully',
  })
})

// ============================================================================
// GET /api/items/user/:userId - Get items by user ID (admin only)
// ============================================================================

items.get('/user/:userId', requireAuth(), requireAdmin(), async (c) => {
  const userId = c.req.param('userId')

  const userItems = await itemRepository.findByUserId(userId as UserId)

  return c.json<ApiResponse<Item[]>>({
    success: true,
    data: userItems,
  })
})

export default items
