import { contabilidadSolRepositoryKey as solRepositoryKey } from '../../application/ports/contabilidad-sol.port'
import { useService } from '@shared/presentation/di/services'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { computed, type Ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { activeLegalEntityIdRef } from '../../../../config/api-scope'
import type { UpsertSolCredentialsBody } from '../../domain/sol.types'
export const contabilidadSolKeys = {
  root: ['contabilidad-sol'] as const,
  credentials: () =>
    [...contabilidadSolKeys.root, 'credentials', activeLegalEntityIdRef.value] as const,
  declarations: (params: Record<string, string | undefined>) =>
    [...contabilidadSolKeys.root, 'declarations', activeLegalEntityIdRef.value, params] as const,
}

export function useContabilidadSolCredentials() {
  const solRepository = useService(solRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadSolKeys.credentials()),
    queryFn: () => solRepository.getCredentials(),
    staleTime: 30_000,
  })
}

export function useContabilidadSaveSolCredentials() {
  const solRepository = useService(solRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpsertSolCredentialsBody) => solRepository.saveCredentials(body),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'contabilidad')
      void markapAlert.toast.success('Credenciales SOL guardadas')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useContabilidadSolDeclarations(
  params: Ref<{ periodId?: string; declarationType?: string }>,
) {
  const solRepository = useService(solRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadSolKeys.declarations(params.value)),
    queryFn: () => solRepository.listDeclarations(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadPreparePdt621() {
  const solRepository = useService(solRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (periodId: string) => solRepository.preparePdt621(periodId),
    onSuccess: async () => await invalidateModuleQueries(qc, 'contabilidad'),
    onError: (e) =>
      void markapAlert.toast.error('No se pudo preparar PDT 621', getApiErrorMessage(e)),
  })
}

export function useContabilidadSubmitPdt621() {
  const solRepository = useService(solRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ logId, periodId }: { logId: string; periodId: string }) =>
      solRepository.submitPdt621(logId, periodId),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'contabilidad')
      void markapAlert.toast.success('Declaración enviada (sandbox)')
    },
    onError: (e) => void markapAlert.toast.error('Envío fallido', getApiErrorMessage(e)),
  })
}

export function useContabilidadMarkPdt621Manual() {
  const solRepository = useService(solRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ logId, periodId }: { logId: string; periodId: string }) =>
      solRepository.markManualPending(logId, periodId),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'contabilidad')
      void markapAlert.toast.info('Marcado para carga manual en SOL')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}
