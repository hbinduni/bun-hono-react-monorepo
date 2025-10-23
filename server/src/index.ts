import type {ApiResponse, Item} from '@shared/types'
import {Hono} from 'hono'
import {cors} from 'hono/cors'

const app = new Hono()

// Enable CORS for frontend
app.use('/*', cors())

app.get('/', (c) => {
  return c.json({
    name: 'Monorepo API',
    version: '1.0.0',
    stack: 'Hono + Bun',
    endpoints: {
      items: {
        method: 'GET',
        path: '/api/items',
        description: 'Get all items',
      },
    },
    frontend: 'http://localhost:5173',
  })
})

// Example API endpoint using shared types
app.get('/api/items', (c) => {
  const response: ApiResponse<Item[]> = {
    success: true,
    data: [
      {
        id: '1',
        userId: 'user-1',
        title: 'Sample Item',
        description: 'This is a sample item from the API',
        createdAt: new Date(),
      },
    ],
  }
  return c.json(response)
})

export default {
  port: 3000,
  fetch: app.fetch,
}
