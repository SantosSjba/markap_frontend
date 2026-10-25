import type { QueryClient } from '@tanstack/vue-query'
type BusinessModule = 'produccion' | 'contabilidad' | 'interiorismo' | 'arquitectura'

/**
 * Las operaciones de estos módulos alimentan varios listados y reportes.
 * Refresca las vistas abiertas y marca las otras como obsoletas para que se
 * actualicen al volver a ellas, sin descargar cada listado inactivo.
 */
export function invalidateModuleQueries(
  queryClient: QueryClient,
  module: BusinessModule,
): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({
      predicate: ({ queryKey }) =>
        typeof queryKey[0] === 'string' &&
        (queryKey[0].startsWith(`${module}-`) ||
          (queryKey[0] === 'clients' && queryKey[1] === module)),
      refetchType: 'active',
    }),
    queryClient.invalidateQueries({ queryKey: ['applications', 'me'] }),
  ]).then(() => undefined)
}
