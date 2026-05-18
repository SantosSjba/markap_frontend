import type { QueryClient, QueryKey } from '@tanstack/vue-query'
import {
  invalidateQuerySubtree,
  refetchQuerySubtree,
} from '@/shared/utils/invalidateQuerySubtree'
import { alquileresQueryKeys } from './alquileresQueryKeys'

/** Presets de invalidación según el dominio que mutó. */
export type AlquileresInvalidationPreset =
  | 'clients'
  | 'properties'
  | 'rentals'
  | 'agents'
  | 'payments'
  | 'all'

const PRESET_ROOTS: Record<AlquileresInvalidationPreset, readonly QueryKey[]> = {
  /** Clientes: propietarios en propiedades, inquilinos en contratos, reportes. */
  clients: [
    alquileresQueryKeys.clients,
    alquileresQueryKeys.properties,
    alquileresQueryKeys.rentals,
    alquileresQueryKeys.reports,
    alquileresQueryKeys.catalog,
  ],
  /** Propiedades: listados de contratos, disponibilidad, reportes. */
  properties: [
    alquileresQueryKeys.properties,
    alquileresQueryKeys.rentals,
    alquileresQueryKeys.reports,
    alquileresQueryKeys.catalog,
  ],
  /** Contratos / distribución financiera: cobranzas, propiedad (estado), reportes. */
  rentals: [
    alquileresQueryKeys.rentals,
    alquileresQueryKeys.payments,
    alquileresQueryKeys.properties,
    alquileresQueryKeys.reports,
    alquileresQueryKeys.config,
  ],
  /** Agentes: combos en distribución financiera y reportes. */
  agents: [
    alquileresQueryKeys.agents,
    alquileresQueryKeys.rentals,
    alquileresQueryKeys.reports,
  ],
  /** Cobranzas: cuotas, contratos, métricas. */
  payments: [
    alquileresQueryKeys.payments,
    alquileresQueryKeys.rentals,
    alquileresQueryKeys.reports,
  ],
  /** Invalida todo el módulo Alquileres. */
  all: [alquileresQueryKeys.module],
}

function rootsForPreset(preset: AlquileresInvalidationPreset): readonly QueryKey[] {
  return PRESET_ROOTS[preset]
}

/**
 * Invalida y refetch de queries relacionadas tras una mutación en Alquileres.
 */
export async function invalidateAlquileresQueries(
  queryClient: QueryClient,
  preset: AlquileresInvalidationPreset,
): Promise<void> {
  const roots = rootsForPreset(preset)
  await Promise.all(roots.map((key) => invalidateQuerySubtree(queryClient, key)))
}

/** Refetch explícito (p. ej. antes de navegar con `returnTo`). */
export async function refetchAlquileresQueries(
  queryClient: QueryClient,
  preset: AlquileresInvalidationPreset,
): Promise<void> {
  const roots = rootsForPreset(preset)
  await Promise.all(roots.map((key) => refetchQuerySubtree(queryClient, key)))
}
