import type { QueryClient, QueryKey } from '@tanstack/vue-query'

/**
 * Invalida todas las queries cuyo `queryKey` empieza por el prefijo dado y fuerza refetch
 * de queries activas e inactivas, para que listas en otras rutas no queden obsoletas en caché.
 *
 * Usar tras mutaciones en lugar de `invalidateQueries` sin `refetchType: 'all'`.
 */
export function invalidateQuerySubtree(
  queryClient: QueryClient,
  queryKey: QueryKey,
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey, refetchType: 'all' })
}

/**
 * Refetch explícito de todo el subárbol (p. ej. antes de navegar y esperar datos frescos).
 */
export function refetchQuerySubtree(queryClient: QueryClient, queryKey: QueryKey): Promise<void> {
  return queryClient.refetchQueries({ queryKey, type: 'all' })
}
