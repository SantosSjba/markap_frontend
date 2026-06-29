import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type {
  CreateContabilidadJournalBody,
  ListContabilidadJournalParams,
  UpdateContabilidadJournalBody,
} from '../domain/journal.types'
import { contabilidadJournalApiRepository as journalRepository } from '../infrastructure/repositories/contabilidad-journal.api.repository'

export const contabilidadJournalKeys = {
  root: ['contabilidad-journal-entries'] as const,
  list: (params: ListContabilidadJournalParams) =>
    [...contabilidadJournalKeys.root, 'list', params] as const,
  detail: (id: string) => [...contabilidadJournalKeys.root, 'detail', id] as const,
}

export function invalidateContabilidadJournalCache(qc: QueryClient) {
  return invalidateQuerySubtree(qc, contabilidadJournalKeys.root)
}

export function useContabilidadJournalList(params: Ref<ListContabilidadJournalParams>) {
  return useQuery({
    queryKey: computed(() => contabilidadJournalKeys.list(params.value)),
    queryFn: () => journalRepository.list(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadJournalDetail(id: Ref<string | undefined>) {
  return useQuery({
    queryKey: computed(() => contabilidadJournalKeys.detail(id.value ?? '')),
    queryFn: () => journalRepository.getById(id.value!),
    enabled: computed(() => Boolean(id.value)),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateJournal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateContabilidadJournalBody) => journalRepository.create(body),
    onSuccess: () => {
      void invalidateContabilidadJournalCache(qc)
      void markapAlert.toast.success('Asiento guardado en borrador')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo crear', getApiErrorMessage(e)),
  })
}

export function useContabilidadUpdateJournal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; body: UpdateContabilidadJournalBody }) =>
      journalRepository.update(args.id, args.body),
    onSuccess: (_, vars) => {
      void invalidateContabilidadJournalCache(qc)
      void markapAlert.toast.success('Asiento actualizado')
      void qc.invalidateQueries({ queryKey: contabilidadJournalKeys.detail(vars.id) })
    },
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}

export function useContabilidadDeleteJournal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => journalRepository.deleteDraft(id),
    onSuccess: () => {
      void invalidateContabilidadJournalCache(qc)
      void markapAlert.toast.success('Borrador eliminado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(e)),
  })
}

export function useContabilidadPostJournal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => journalRepository.post(id),
    onSuccess: (_, id) => {
      void invalidateContabilidadJournalCache(qc)
      void markapAlert.toast.success('Asiento publicado')
      void qc.invalidateQueries({ queryKey: contabilidadJournalKeys.detail(id) })
    },
    onError: (e) => void markapAlert.toast.error('No se pudo publicar', getApiErrorMessage(e)),
  })
}

export function useContabilidadReverseJournal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => journalRepository.reverse(id),
    onSuccess: () => {
      void invalidateContabilidadJournalCache(qc)
      void markapAlert.toast.success('Asiento reversado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo reversar', getApiErrorMessage(e)),
  })
}
