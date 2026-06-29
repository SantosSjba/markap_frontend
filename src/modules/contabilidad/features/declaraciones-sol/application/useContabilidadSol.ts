import { computed, type Ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { activeLegalEntityIdRef } from '@modules/contabilidad/config/api-scope'
import type { UpsertSolCredentialsBody } from '../domain/sol.types'
import { contabilidadSolApiRepository as solRepository } from '../infrastructure/repositories/contabilidad-sol.api.repository'

export const contabilidadSolKeys = {
  root: ['contabilidad-sol'] as const,
  credentials: () => [...contabilidadSolKeys.root, 'credentials', activeLegalEntityIdRef.value] as const,
  declarations: (params: Record<string, string | undefined>) =>
    [...contabilidadSolKeys.root, 'declarations', activeLegalEntityIdRef.value, params] as const,
}

export function useContabilidadSolCredentials() {
  return useQuery({
    queryKey: computed(() => contabilidadSolKeys.credentials()),
    queryFn: () => solRepository.getCredentials(),
    staleTime: 30_000,
  })
}

export function useContabilidadSaveSolCredentials() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpsertSolCredentialsBody) => solRepository.saveCredentials(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contabilidadSolKeys.root })
      void markapAlert.toast.success('Credenciales SOL guardadas')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useContabilidadSolDeclarations(
  params: Ref<{ periodId?: string; declarationType?: string }>,
) {
  return useQuery({
    queryKey: computed(() => contabilidadSolKeys.declarations(params.value)),
    queryFn: () => solRepository.listDeclarations(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadPreparePdt621() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (periodId: string) => solRepository.preparePdt621(periodId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: contabilidadSolKeys.root }),
    onError: (e) => void markapAlert.toast.error('No se pudo preparar PDT 621', getApiErrorMessage(e)),
  })
}

export function useContabilidadSubmitPdt621() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ logId, periodId }: { logId: string; periodId: string }) =>
      solRepository.submitPdt621(logId, periodId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contabilidadSolKeys.root })
      void markapAlert.toast.success('Declaración enviada (sandbox)')
    },
    onError: (e) => void markapAlert.toast.error('Envío fallido', getApiErrorMessage(e)),
  })
}

export function useContabilidadMarkPdt621Manual() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ logId, periodId }: { logId: string; periodId: string }) =>
      solRepository.markManualPending(logId, periodId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contabilidadSolKeys.root })
      void markapAlert.toast.info('Marcado para carga manual en SOL')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}

export { contabilidadSolApiRepository } from '../infrastructure/repositories/contabilidad-sol.api.repository'
