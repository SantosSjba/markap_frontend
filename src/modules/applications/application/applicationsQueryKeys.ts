/**
 * Raíces de query keys del módulo Applications.
 * Todas las queries deben empezar por `['applications', …]` para invalidar en bloque.
 */
export const applicationsQueryKeys = {
  /** Invalida todo el módulo (listado del usuario + menús por app). */
  module: ['applications'] as const,
  /** Apps asignadas al usuario autenticado (`/applications/me`). */
  myApps: ['applications', 'me'] as const,
  /** Menús de navegación por slug (`/applications/:slug/menus`). */
  menus: ['applications', 'menus'] as const,
} as const
