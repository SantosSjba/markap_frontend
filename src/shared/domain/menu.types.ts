/**
 * Menu Types
 * Menú lateral estático de cada aplicación (`modules/<app>/config/menu.ts`)
 */

export interface MenuItem {
  id: string
  label: string
  icon: string | null
  path: string | null
  order: number
  children?: MenuItem[]
}
