/**
 * API Types
 * Common types for API responses and requests
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T
  message?: string
  statusCode: number
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * API Error response
 */
export interface ApiError {
  message: string
  error?: string
  statusCode: number
}

/**
 * Pagination params for requests
 */
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Search params
 */
export interface SearchParams extends PaginationParams {
  search?: string
  filters?: Record<string, unknown>
}
