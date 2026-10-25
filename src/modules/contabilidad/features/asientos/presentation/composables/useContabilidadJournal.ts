import { contabilidadJournalRepositoryKey as journalRepositoryKey } from '../../application/ports/contabilidad-journal.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import type {
  CreateContabilidadJournalBody,
  ListContabilidadJournalParams,
  UpdateContabilidadJournalBody,
} from '../../domain/journal.types'
export const contabilidadJournalKeys = {
  root: ['contabilidad-journal-entries'] as const,
  list: (params: ListContabilidadJournalParams) =>
    [...contabilidadJournalKeys.root, 'list', params] as const,
  detail: (id: string) => [...contabilidadJournalKeys.root, 'detail', id] as const,
}

export function invalidateContabilidadJournalCache(qc: QueryClient) {
  return invalidateModuleQueries(qc, 'contabilidad')
}

export function useContabilidadJournalList(params: Ref<ListContabilidadJournalParams>) {
  const journalRepository = useService(journalRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadJournalKeys.list(params.value)),
    queryFn: () => journalRepository.list(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadJournalDetail(id: Ref<string | undefined>) {
  const journalRepository = useService(journalRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadJournalKeys.detail(id.value ?? '')),
    queryFn: () => journalRepository.getById(id.value!),
    enabled: computed(() => Boolean(id.value)),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateJournal() {
  const journalRepository = useService(journalRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateContabilidadJournalBody) => journalRepository.create(body),
    onSuccess: async () => {
      await invalidateContabilidadJournalCache(qc)
      void markapAlert.toast.success('Asiento guardado en borrador')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo crear', getApiErrorMessage(e)),
  })
}

export function useContabilidadUpdateJournal() {
  const journalRepository = useService(journalRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; body: UpdateContabilidadJournalBody }) =>
      journalRepository.update(args.id, args.body),
    onSuccess: async () => {
      await invalidateContabilidadJournalCache(qc)
      void markapAlert.toast.success('Asiento actualizado')
      await invalidateModuleQueries(qc, 'contabilidad')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}

export function useContabilidadDeleteJournal() {
  const journalRepository = useService(journalRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => journalRepository.deleteDraft(id),
    onSuccess: async () => {
      await invalidateContabilidadJournalCache(qc)
      void markapAlert.toast.success('Borrador eliminado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(e)),
  })
}

export function useContabilidadPostJournal() {
  const journalRepository = useService(journalRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => journalRepository.post(id),
    onSuccess: async () => {
      await invalidateContabilidadJournalCache(qc)
      void markapAlert.toast.success('Asiento publicado')
      await invalidateModuleQueries(qc, 'contabilidad')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo publicar', getApiErrorMessage(e)),
  })
}

export function useContabilidadReverseJournal() {
  const journalRepository = useService(journalRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => journalRepository.reverse(id),
    onSuccess: async () => {
      await invalidateContabilidadJournalCache(qc)
      void markapAlert.toast.success('Asiento reversado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo reversar', getApiErrorMessage(e)),
  })
}
