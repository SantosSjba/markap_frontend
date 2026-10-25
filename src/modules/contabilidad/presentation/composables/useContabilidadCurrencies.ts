import { useQuery } from '@tanstack/vue-query'
import { DIRECTORY } from '@shared/application/ports/directory.port'
import { useService } from '@shared/presentation/di/services'
export type { CurrencyOption as ContabilidadCurrencyDTO } from '@shared/application/ports/directory.port'

export const contabilidadCurrencyKeys = {
  root: ['contabilidad-currencies'] as const,
  list: () => [...contabilidadCurrencyKeys.root, 'list'] as const,
}

export function useContabilidadCurrencies() {
  const directory = useService(DIRECTORY)
  return useQuery({
    queryKey: contabilidadCurrencyKeys.list(),
    queryFn: () => directory.listCurrencies(),
    staleTime: 60_000,
  })
}

export * from '../../domain/currency'
