import type { RouteLocationRaw } from 'vue-router'

export interface QuickAction {
  id: string
  label: string
  route: RouteLocationRaw
  /** Icono Iconify: "colección:nombre" */
  icon: string
  primary?: boolean
}
