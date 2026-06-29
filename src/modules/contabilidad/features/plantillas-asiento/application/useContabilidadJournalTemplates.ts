import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type {
  CreateJournalTemplateBody,
  UpdateJournalTemplateBody,
} from '../domain/journal-template.types'
import { contabilidadJournalTemplatesApiRepository as templatesRepository } from '../infrastructure/repositories/contabilidad-journal-templates.api.repository'

export const contabilidadJournalTemplatesKeys = {
  root: ['contabilidad-journal-templates'] as const,
  list: () => [...contabilidadJournalTemplatesKeys.root, 'list'] as const,
}

export function invalidateContabilidadJournalTemplatesCache(qc: QueryClient) {
  return invalidateQuerySubtree(qc, contabilidadJournalTemplatesKeys.root)
}

export function useContabilidadJournalTemplates() {
  return useQuery({
    queryKey: contabilidadJournalTemplatesKeys.list(),
    queryFn: () => templatesRepository.listTemplates(),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateJournalTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateJournalTemplateBody) => templatesRepository.createTemplate(body),
    onSuccess: () => {
      void invalidateContabilidadJournalTemplatesCache(qc)
      void markapAlert.toast.success('Plantilla creada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo crear', getApiErrorMessage(e)),
  })
}

export function useContabilidadUpdateJournalTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateJournalTemplateBody }) =>
      templatesRepository.updateTemplate(id, body),
    onSuccess: () => {
      void invalidateContabilidadJournalTemplatesCache(qc)
      void markapAlert.toast.success('Plantilla actualizada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}

export function useContabilidadApplyJournalTemplate() {
  return useMutation({
    mutationFn: (id: string) => templatesRepository.applyTemplate(id),
    onError: (e) => void markapAlert.toast.error('No se pudo aplicar la plantilla', getApiErrorMessage(e)),
  })
}
