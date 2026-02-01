/**
 * Common Types
 * Shared type definitions used across the application
 */

/**
 * Generic ID type
 */
export type ID = string | number

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null

/**
 * Optional type helper
 */
export type Optional<T> = T | undefined

/**
 * Select option type
 */
export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  label: string
  to?: string
  active?: boolean
}

/**
 * Table column definition
 */
export interface TableColumn<T = unknown> {
  key: keyof T | string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  formatter?: (value: unknown, row: T) => string
}

/**
 * Menu item for navigation
 */
export interface MenuItem {
  id: string
  label: string
  icon?: string
  to?: string
  children?: MenuItem[]
  permission?: string
  badge?: string | number
}
