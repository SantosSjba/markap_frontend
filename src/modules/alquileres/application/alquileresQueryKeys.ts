/**
 * Raíces de query keys del módulo Alquileres.
 * Todas las queries del módulo deben empezar por `['alquileres', …]` para poder invalidar en bloque.
 */
export const alquileresQueryKeys = {
  /** Invalida todo el módulo Alquileres. */
  module: ['alquileres'] as const,
  clients: ['alquileres', 'clients'] as const,
  agents: ['alquileres', 'agents'] as const,
  properties: ['alquileres', 'properties'] as const,
  rentals: ['alquileres', 'rentals'] as const,
  payments: ['alquileres', 'payments'] as const,
  reports: ['alquileres', 'reports'] as const,
  /** Ubigeo compartido (clientes y propiedades usan la misma API). */
  catalog: ['alquileres', 'catalog'] as const,
  /** Configuración del módulo (alertas, etc.). */
  config: ['alquileres', 'config'] as const,
} as const

export const alquileresConfigKeys = {
  alertConfig: (slug = 'alquileres') =>
    [...alquileresQueryKeys.config, 'alert-config', slug] as const,
}

/** Catálogos geográficos y tipos de documento (clientes). */
export const alquileresCatalogKeys = {
  departments: [...alquileresQueryKeys.catalog, 'departments'] as const,
  provinces: (departmentId?: string) =>
    [...alquileresQueryKeys.catalog, 'provinces', departmentId ?? 'all'] as const,
  districts: (provinceId?: string) =>
    [...alquileresQueryKeys.catalog, 'districts', provinceId ?? 'all'] as const,
  documentTypes: [...alquileresQueryKeys.clients, 'document-types'] as const,
}
