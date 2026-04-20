import { ref } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type { UpsertAlertConfigPayload } from '../domain/alert-config.types'
import { alertConfigApiRepository as alertConfigRepository } from '../infrastructure/repositories/alert-config.api.repository'

export function useAlertConfig(applicationSlug = 'alquileres') {
  const queryKey = ['alert-config', applicationSlug]
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
