import type {ApiResponse, Feedback} from '@shared/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function getFeedback(): Promise<Feedback[]> {
  const response = await fetch(`${API_BASE_URL}/api/feedback`)
  const data: ApiResponse<Feedback[]> = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to fetch feedback')
  }

  return data.data
}
