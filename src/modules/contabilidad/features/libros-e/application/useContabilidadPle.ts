import { useQuery, useMutation } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { contabilidadPleApiRepository as pleRepository } from '../infrastructure/repositories/contabilidad-ple.api.repository'

export const contabilidadPleKeys = {
  root: ['contabilidad-ple'] as const,
  books: () => [...contabilidadPleKeys.root, 'books'] as const,
  libroMayor: (periodId?: string, accountId?: string) =>
    [...contabilidadPleKeys.root, 'libro-mayor', periodId, accountId] as const,
}

export function useContabilidadPleBooks() {
  return useQuery({
    queryKey: contabilidadPleKeys.books(),
    queryFn: () => pleRepository.listBooks(),
    staleTime: 60_000,
  })
}

export function useContabilidadLibroMayor(
  periodId: Ref<string | undefined>,
  accountId: Ref<string | undefined>,
) {
  return useQuery({
    queryKey: computed(() => contabilidadPleKeys.libroMayor(periodId.value, accountId.value)),
    queryFn: () => pleRepository.getLibroMayor(periodId.value!, accountId.value || undefined),
    enabled: computed(() => Boolean(periodId.value)),
    staleTime: 10_000,
  })
}

export function useContabilidadGeneratePle() {
  return useMutation({
    mutationFn: ({ periodId, bookCodes }: { periodId: string; bookCodes: string[] }) =>
      pleRepository.generateBooks(periodId, bookCodes),
    onError: (e) => void markapAlert.toast.error('No se pudo generar PLE', getApiErrorMessage(e)),
  })
}
