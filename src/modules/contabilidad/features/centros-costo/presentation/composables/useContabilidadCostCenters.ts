import { contabilidadCostCentersRepositoryKey as costCentersRepositoryKey } from '../../application/ports/contabilidad-cost-centers.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import type {
  CreateContabilidadCostCenterBody,
  UpdateContabilidadCostCenterBody,
} from '../../domain/cost-center.types'
export const contabilidadCostCentersKeys = {
  root: ['contabilidad-cost-centers'] as const,
  list: (search?: string) => [...contabilidadCostCentersKeys.root, 'list', search ?? ''] as const,
}

export function invalidateContabilidadCostCentersCache(qc: QueryClient) {
  return invalidateModuleQueries(qc, 'contabilidad')
}

export function useContabilidadCostCentersList(search: Ref<string>) {
  const costCentersRepository = useService(costCentersRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadCostCentersKeys.list(search.value || undefined)),
    queryFn: () => costCentersRepository.list(search.value || undefined),
    staleTime: 15_000,
  })
}

export function useContabilidadCreateCostCenter() {
  const costCentersRepository = useService(costCentersRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateContabilidadCostCenterBody) => costCentersRepository.create(body),
    onSuccess: async () => {
      await invalidateContabilidadCostCentersCache(qc)
      void markapAlert.toast.success('Centro de costo creado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo crear', getApiErrorMessage(e)),
  })
}

export function useContabilidadUpdateCostCenter() {
  const costCentersRepository = useService(costCentersRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; body: UpdateContabilidadCostCenterBody }) =>
      costCentersRepository.update(args.id, args.body),
    onSuccess: async () => {
      await invalidateContabilidadCostCentersCache(qc)
      void markapAlert.toast.success('Centro de costo actualizado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}

export function useContabilidadDeactivateCostCenter() {
  const costCentersRepository = useService(costCentersRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => costCentersRepository.deactivate(id),
    onSuccess: async () => {
      await invalidateContabilidadCostCentersCache(qc)
      void markapAlert.toast.success('Centro de costo desactivado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo desactivar', getApiErrorMessage(e)),
  })
}
