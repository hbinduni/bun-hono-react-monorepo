// Shared TypeScript types between client and server

export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

export interface Item {
  id: string
  userId: string
  title: string
  description: string
  createdAt: Date
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
