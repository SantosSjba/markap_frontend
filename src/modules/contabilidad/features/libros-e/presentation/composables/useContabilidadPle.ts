import { contabilidadPleRepositoryKey as pleRepositoryKey } from '../../application/ports/contabilidad-ple.port'
import { useService } from '@shared/presentation/di/services'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { downloadBlobFile } from '@shared/infrastructure/browser/download-file'
export const contabilidadPleKeys = {
  root: ['contabilidad-ple'] as const,
  books: () => [...contabilidadPleKeys.root, 'books'] as const,
  mandatoryProfile: () => [...contabilidadPleKeys.root, 'mandatory-profile'] as const,
  exportLogs: (periodId?: string) =>
    [...contabilidadPleKeys.root, 'export-logs', periodId] as const,
  libroMayor: (periodId?: string, accountId?: string) =>
    [...contabilidadPleKeys.root, 'libro-mayor', periodId, accountId] as const,
}

export function useContabilidadPleBooks() {
  const pleRepository = useService(pleRepositoryKey)
  return useQuery({
    queryKey: contabilidadPleKeys.books(),
    queryFn: () => pleRepository.listBooks(),
    staleTime: 60_000,
  })
}

export function useContabilidadPleMandatoryProfile() {
  const pleRepository = useService(pleRepositoryKey)
  return useQuery({
    queryKey: contabilidadPleKeys.mandatoryProfile(),
    queryFn: () => pleRepository.getMandatoryProfile(),
    staleTime: 60_000,
  })
}

export function useContabilidadPleExportLogs(periodId: Ref<string | undefined>) {
  const pleRepository = useService(pleRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadPleKeys.exportLogs(periodId.value)),
    queryFn: () => pleRepository.listExportLogs(periodId.value, 30),
    enabled: computed(() => Boolean(periodId.value)),
    staleTime: 10_000,
  })
}

export function useContabilidadLibroMayor(
  periodId: Ref<string | undefined>,
  accountId: Ref<string | undefined>,
) {
  const pleRepository = useService(pleRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadPleKeys.libroMayor(periodId.value, accountId.value)),
    queryFn: () => pleRepository.getLibroMayor(periodId.value!, accountId.value || undefined),
    enabled: computed(() => Boolean(periodId.value)),
    staleTime: 10_000,
  })
}

export function useContabilidadGeneratePle() {
  const pleRepository = useService(pleRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ periodId, bookCodes }: { periodId: string; bookCodes: string[] }) =>
      pleRepository.generateBooks(periodId, bookCodes),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'contabilidad')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo generar PLE', getApiErrorMessage(e)),
  })
}

export function useContabilidadDownloadPleZip() {
  const pleRepository = useService(pleRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ periodId, bookCodes }: { periodId: string; bookCodes: string[] }) =>
      pleRepository.downloadZip(periodId, bookCodes),
    onSuccess: async (data) => {
      downloadBlobFile(data.fileName, data.blob)
      await invalidateModuleQueries(qc, 'contabilidad')
      void markapAlert.toast.success('ZIP PLE descargado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo descargar ZIP', getApiErrorMessage(e)),
  })
}
