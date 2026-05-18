import type { QueryClient, QueryKey } from '@tanstack/vue-query'
import {
  invalidateQuerySubtree,
  refetchQuerySubtree,
} from '@/shared/utils/invalidateQuerySubtree'
import { applicationsQueryKeys } from './applicationsQueryKeys'

/** Presets de invalidación según qué dato cambió. */
export type ApplicationsInvalidationPreset =
  | 'myApps'
  | 'menus'
  /** Permisos / asignación rol–app: refresca listado del usuario y menús de todas las apps. */
  | 'access'
  | 'all'

const PRESET_ROOTS: Record<ApplicationsInvalidationPreset, readonly QueryKey[]> = {
  myApps: [applicationsQueryKeys.myApps],
  menus: [applicationsQueryKeys.menus],
  access: [applicationsQueryKeys.myApps, applicationsQueryKeys.menus],
  all: [applicationsQueryKeys.module],
}

function rootsForPreset(preset: ApplicationsInvalidationPreset): readonly QueryKey[] {
  return PRESET_ROOTS[preset]
}

/** Invalida queries del módulo Applications tras una mutación. */
export async function invalidateApplicationsQueries(
  queryClient: QueryClient,
  preset: ApplicationsInvalidationPreset,
): Promise<void> {
  const roots = rootsForPreset(preset)
  await Promise.all(roots.map((key) => invalidateQuerySubtree(queryClient, key)))
}

/** Refetch explícito (p. ej. tras login o antes de navegar). */
export async function refetchApplicationsQueries(
  queryClient: QueryClient,
  preset: ApplicationsInvalidationPreset,
): Promise<void> {
  const roots = rootsForPreset(preset)
  await Promise.all(roots.map((key) => refetchQuerySubtree(queryClient, key)))
}
