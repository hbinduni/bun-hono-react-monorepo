import type {ApiResponse, Feedback} from '@shared/types'
import {Hono} from 'hono'
import {cors} from 'hono/cors'

const app = new Hono()

// Enable CORS for frontend
app.use('/*', cors())

app.get('/', (c) => {
  return c.text('User Feedback API - Hono + Bun')
})

// Example API endpoint using shared types
app.get('/api/feedback', (c) => {
  const response: ApiResponse<Feedback[]> = {
    success: true,
    data: [
      {
        id: '1',
        userId: 'user-1',
        message: 'Great product!',
        rating: 5,
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
