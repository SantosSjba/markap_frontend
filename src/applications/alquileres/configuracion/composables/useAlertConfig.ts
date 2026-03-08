import { ref } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { alertConfigService } from '../services/alert-config.service'
import type { UpsertAlertConfigPayload } from '../services/alert-config.service'

export function useAlertConfig(applicationSlug = 'alquileres') {
  const queryKey = ['alert-config', applicationSlug]
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => alertConfigService.get(applicationSlug),
    staleTime: 1000 * 60 * 5,
  })

  const saveError = ref<string | null>(null)
  const saveSuccess = ref(false)

  const { mutateAsync: save, isPending: isSaving } = useMutation({
    mutationFn: (payload: UpsertAlertConfigPayload) =>
      alertConfigService.upsert(applicationSlug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      saveSuccess.value = true
      saveError.value = null
      setTimeout(() => { saveSuccess.value = false }, 3000)
    },
    onError: (e: any) => {
      saveError.value = e?.response?.data?.message ?? 'Error al guardar la configuración'
    },
  })

  return { data, isLoading, error, save, isSaving, saveError, saveSuccess }
}
