import type {ApiResponse, Item} from '@shared/types'
import {config} from '@/config'

const API_BASE_URL = config.VITE_API_URL

export async function getItems(): Promise<Item[]> {
  const response = await fetch(`${API_BASE_URL}/api/items`)
  const data: ApiResponse<Item[]> = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to fetch items')
  }

  return data.data
}
