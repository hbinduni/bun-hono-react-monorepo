// Shared TypeScript types between client and server

export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

export interface Feedback {
  id: string
  userId: string
  message: string
  rating: number
  createdAt: Date
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
