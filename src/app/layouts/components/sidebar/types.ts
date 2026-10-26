export type MenuType = 'main' | 'others'

export interface SubItem {
  name: string
  path: string
  /** Resuelto por el sidebar con las reglas de coincidencia de Markap. */
  active: boolean
  pro?: boolean
  new?: boolean
  target?: string
}

export interface NavItem {
  name: string
  /** Id de Iconify (ej. `lucide:home`). */
  icon: string
  path?: string
  active: boolean
  new?: boolean
  target?: string
  subItems?: SubItem[]
}

export interface MenuSection {
  type: MenuType
  label: string
  items: NavItem[]
}

export interface ApplicationInfo {
  name: string
  slug: string
  icon?: string | null
  color?: string | null
}
