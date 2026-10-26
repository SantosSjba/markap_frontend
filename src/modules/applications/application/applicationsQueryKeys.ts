/**
 * Raíces de query keys del módulo Applications.
 * Todas las queries deben empezar por `['applications', …]` para invalidar en bloque.
 */
export const applicationsQueryKeys = {
  /** Invalida todo el módulo. */
  module: ['applications'] as const,
  /** Apps asignadas al usuario autenticado (`/applications/me`). */
  myApps: ['applications', 'me'] as const,
} as const
