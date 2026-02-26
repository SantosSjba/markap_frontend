/**
 * Application Types
 */

export interface Application {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  url: string | null
  activeCount: number
  pendingCount: number
  order: number
}
