import { alertConfigRepositoryKey } from '../../application/ports/alert-config.port'
import { useService } from '@shared/presentation/di/services'
import { ref } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@shared/utils/invalidateQuerySubtree'
import { invalidateAlquileresQueries } from '../../../../presentation/queries/invalidateAlquileresQueries'
import { alquileresConfigKeys } from '../../../../application/alquileresQueryKeys'
import type { UpsertAlertConfigPayload } from '../../domain/alert-config.types'
export function useAlertConfig(applicationSlug = 'alquileres') {
  const alertConfigRepository = useService(alertConfigRepositoryKey)
  const queryKey = alquileresConfigKeys.alertConfig(applicationSlug)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => alertConfigRepository.get(applicationSlug),
    staleTime: 1000 * 60 * 5,
  })

  const saveError = ref<string | null>(null)
  const saveSuccess = ref(false)

  const { mutateAsync: save, isPending: isSaving } = useMutation({
    mutationFn: (payload: UpsertAlertConfigPayload) =>
      alertConfigRepository.upsert(applicationSlug, payload),
    onSuccess: () => {
      void invalidateQuerySubtree(queryClient, queryKey)
      void invalidateAlquileresQueries(queryClient, 'rentals')
      saveSuccess.value = true
      saveError.value = null
      void markapAlert.toast.success('Configuración de alertas guardada')
      setTimeout(() => {
        saveSuccess.value = false
      }, 3000)
    },
    onError: (e: unknown) => {
      const msg = getApiErrorMessage(e, 'Error al guardar la configuración')
      saveError.value = msg
      void markapAlert.toast.error('No se pudo guardar', msg)
    },
  })

  return { data, isLoading, error, save, isSaving, saveError, saveSuccess }
}
