import { ARQUITECTURA_APP_SLUG } from '../config/app.constants'

/**
 * Raíces de query keys del módulo Arquitectura.
 * Todas las queries del módulo deben empezar por `['arquitectura', …]` para poder invalidar en bloque.
 */
export const arquitecturaQueryKeys = {
  /** Invalida todo el módulo Arquitectura. */
  module: ['arquitectura'] as const,
  clients: ['arquitectura', 'clients', ARQUITECTURA_APP_SLUG] as const,
  projects: ['arquitectura-projects', ARQUITECTURA_APP_SLUG] as const,
  config: ['arquitectura-config'] as const,
} as const

export const arquitecturaConfigKeys = {
  root: arquitecturaQueryKeys.config,
  bootstrap: () => [...arquitecturaQueryKeys.config, 'bootstrap'] as const,
}

export const arquitecturaClientKeys = {
  all: arquitecturaQueryKeys.clients,
  list: (params: Record<string, unknown>) =>
    [...arquitecturaQueryKeys.clients, 'list', params] as const,
  detail: (id: string) => [...arquitecturaQueryKeys.clients, 'detail', id] as const,
  stats: (slug = ARQUITECTURA_APP_SLUG) =>
    [...arquitecturaQueryKeys.clients, 'stats', slug] as const,
  documentTypes: () => [...arquitecturaQueryKeys.clients, 'document-types'] as const,
  departments: () => [...arquitecturaQueryKeys.clients, 'departments'] as const,
  provinces: (departmentId?: string) =>
    [...arquitecturaQueryKeys.clients, 'provinces', departmentId ?? 'all'] as const,
  districts: (provinceId?: string) =>
    [...arquitecturaQueryKeys.clients, 'districts', provinceId ?? 'all'] as const,
}
