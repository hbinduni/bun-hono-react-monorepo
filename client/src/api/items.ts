import type {ApiResponse, Item} from '@shared/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function getItems(): Promise<Item[]> {
  const response = await fetch(`${API_BASE_URL}/api/items`)
  const data: ApiResponse<Item[]> = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to fetch items')
  }

  return data.data
}
