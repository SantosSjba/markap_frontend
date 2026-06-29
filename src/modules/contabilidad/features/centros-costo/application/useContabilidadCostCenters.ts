import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type {
  CreateContabilidadCostCenterBody,
  UpdateContabilidadCostCenterBody,
} from '../domain/cost-center.types'
import { contabilidadCostCentersApiRepository as costCentersRepository } from '../infrastructure/repositories/contabilidad-cost-centers.api.repository'

export const contabilidadCostCentersKeys = {
  root: ['contabilidad-cost-centers'] as const,
  list: (search?: string) => [...contabilidadCostCentersKeys.root, 'list', search ?? ''] as const,
}

export function invalidateContabilidadCostCentersCache(qc: QueryClient) {
  return invalidateQuerySubtree(qc, contabilidadCostCentersKeys.root)
}

export function useContabilidadCostCentersList(search: Ref<string>) {
  return useQuery({
    queryKey: computed(() => contabilidadCostCentersKeys.list(search.value || undefined)),
    queryFn: () => costCentersRepository.list(search.value || undefined),
    staleTime: 15_000,
  })
}

export function useContabilidadCreateCostCenter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateContabilidadCostCenterBody) => costCentersRepository.create(body),
    onSuccess: () => {
      void invalidateContabilidadCostCentersCache(qc)
      void markapAlert.toast.success('Centro de costo creado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo crear', getApiErrorMessage(e)),
  })
}

export function useContabilidadUpdateCostCenter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; body: UpdateContabilidadCostCenterBody }) =>
      costCentersRepository.update(args.id, args.body),
    onSuccess: () => {
      void invalidateContabilidadCostCentersCache(qc)
      void markapAlert.toast.success('Centro de costo actualizado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}

export function useContabilidadDeactivateCostCenter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => costCentersRepository.deactivate(id),
    onSuccess: () => {
      void invalidateContabilidadCostCentersCache(qc)
      void markapAlert.toast.success('Centro de costo desactivado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo desactivar', getApiErrorMessage(e)),
  })
}
