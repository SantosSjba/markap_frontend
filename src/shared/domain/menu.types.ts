/**
 * Menu Types
 * Sincronizado con el backend
 */

export interface MenuItem {
  id: string
  label: string
  icon: string | null
  path: string | null
  order: number
  children?: MenuItem[]
}
