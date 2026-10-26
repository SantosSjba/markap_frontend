import type { MenuItem } from '@shared/domain/menu.types'
import type { NavItem } from './types'

/**
 * Traduce los menús de la BD al formato de navegación de TailAdmin,
 * conservando las reglas de Markap para decidir qué ítem está activo.
 */

// Rutas de menú que redirigen a otra URL (solo navegación; no compiten por resaltado)
const MENU_ACTIVE_ALIASES: Record<string, string> = {
  '/contabilidad/libros-e/libro-diario': '/contabilidad/asientos/libro-diario',
}

// Convierte path del menú a ruta completa
// parentFullPath: cuando es un hijo, el path del hijo es relativo al padre
// Si el path ya está bajo la base de la app (ej: /alquileres/clientes), se usa tal cual
export function toFullPath(basePath: string, path: string | null, parentFullPath?: string): string {
  if (!path || path === '#') return '#'
  const base = parentFullPath ?? basePath
  if (path === '/' || path === '') return base
  const pathNorm = path.startsWith('/') ? path : `/${path}`
  // Path ya es absoluto dentro de esta aplicación → no concatenar al padre
  if (pathNorm === basePath || pathNorm.startsWith(basePath + '/')) {
    return pathNorm.replace(/\/$/, '') || pathNorm
  }
  const segment = path.startsWith('/') ? path.slice(1) : path
  const parentBase = base.replace(/\/$/, '')
  return parentBase ? `${parentBase}/${segment}` : `/${segment}`
}

function isLibrosElectronicosSection(basePath: string, parent: MenuItem): boolean {
  const parentFull = toFullPath(basePath, parent.path)
  return (
    parent.label?.toLowerCase().includes('libros electr') === true ||
    parentFull.includes('/libros-e') ||
    parent.id.toLowerCase().includes('lib')
  )
}

/** Enlace en Libros electrónicos que apunta al módulo de asientos (no debe resaltarse allí). */
function isLibrosCrossLink(basePath: string, menuFull: string, parent: MenuItem): boolean {
  if (!isLibrosElectronicosSection(basePath, parent)) return false
  const resolved = MENU_ACTIVE_ALIASES[menuFull] ?? menuFull
  return (
    resolved.startsWith('/contabilidad/asientos') || menuFull.startsWith('/contabilidad/asientos')
  )
}

function scoreMenuMatch(
  basePath: string,
  menuFull: string,
  routePath: string,
  parent: MenuItem,
): number {
  if (menuFull === '#') return 0
  if (isLibrosCrossLink(basePath, menuFull, parent)) return 0

  const resolved = MENU_ACTIVE_ALIASES[menuFull] ?? menuFull
  const isAlias = menuFull !== resolved

  if (routePath === resolved || routePath === resolved + '/') {
    return 1000 + resolved.length - (isAlias ? 100 : 0)
  }
  if (routePath.startsWith(resolved + '/')) {
    return 500 + resolved.length
  }
  return 0
}

function menuPathMatchesRoute(menuFull: string, routePath: string): boolean {
  if (menuFull === '#') return false
  const resolved = MENU_ACTIVE_ALIASES[menuFull] ?? menuFull
  return (
    routePath === resolved || routePath === resolved + '/' || routePath.startsWith(resolved + '/')
  )
}

/** Un solo ítem hijo activo en todo el sidebar (el de mayor especificidad). */
function findActiveChild(basePath: string, menus: MenuItem[], routePath: string) {
  let best: { parentId: string; childId: string; score: number } | null = null

  for (const parent of menus) {
    if (!parent.children?.length) continue
    const parentFull = toFullPath(basePath, parent.path)

    for (const child of parent.children) {
      if (!child.path) continue
      const menuFull = toFullPath(basePath, child.path, parentFull)
      const score = scoreMenuMatch(basePath, menuFull, routePath, parent)
      if (score <= 0) continue
      if (!best || score > best.score) {
        best = { parentId: parent.id, childId: child.id, score }
      }
    }
  }
  return best
}

function isLeafActive(basePath: string, path: string | null, routePath: string): boolean {
  if (!path) return false
  const full = toFullPath(basePath, path)
  if (full === '#') return false
  // El path raíz de la aplicación (ej: /alquileres) es el Dashboard:
  // solo coincide de forma exacta, nunca por prefijo.
  if (full === basePath || path === '/' || path === '') {
    return routePath === full || routePath === full + '/'
  }
  return menuPathMatchesRoute(full, routePath)
}

/** Nombre desde BD (ej. layout-dashboard, LayoutDashboard) → id Iconify */
export function menuIconId(iconName: string | null | undefined): string {
  const key = iconName
    ? iconName
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')
    : 'layout-dashboard'
  if (key.includes(':')) return key
  return `lucide:${key}`
}

export function buildNavItems(basePath: string, menus: MenuItem[], routePath: string): NavItem[] {
  const activeChild = findActiveChild(basePath, menus, routePath)

  return menus.map((item) => {
    if (item.children?.length) {
      const parentFull = toFullPath(basePath, item.path)
      return {
        name: item.label,
        icon: menuIconId(item.icon),
        active: activeChild?.parentId === item.id,
        subItems: item.children.map((child) => ({
          name: child.label,
          path: toFullPath(basePath, child.path, parentFull),
          active: activeChild?.parentId === item.id && activeChild.childId === child.id,
        })),
      }
    }
    return {
      name: item.label,
      icon: menuIconId(item.icon),
      path: toFullPath(basePath, item.path),
      active: isLeafActive(basePath, item.path, routePath),
    }
  })
}
