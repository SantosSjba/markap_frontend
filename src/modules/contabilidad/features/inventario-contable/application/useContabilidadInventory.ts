import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import type { CreateInventoryItemBody, CreateInventoryMovementBody } from '../domain/inventory.types'
import { contabilidadInventoryApiRepository as inventoryRepository } from '../infrastructure/repositories/contabilidad-inventory.api.repository'

export const contabilidadInventoryKeys = {
  root: ['contabilidad-inventory'] as const,
  catalog: () => [...contabilidadInventoryKeys.root, 'catalog'] as const,
  items: (params: Record<string, string | undefined>) =>
    [...contabilidadInventoryKeys.root, 'items', params] as const,
  movements: (params: Record<string, string | undefined>) =>
    [...contabilidadInventoryKeys.root, 'movements', params] as const,
  kardex: (itemId?: string) => [...contabilidadInventoryKeys.root, 'kardex', itemId] as const,
  valued: () => [...contabilidadInventoryKeys.root, 'valued'] as const,
}

export function useContabilidadInventoryCatalog() {
  return useQuery({
    queryKey: contabilidadInventoryKeys.catalog(),
    queryFn: () => inventoryRepository.getCatalog(),
    staleTime: 60_000,
  })
}

export function useContabilidadInventoryItems(params: Ref<Record<string, string | undefined>>) {
  return useQuery({
    queryKey: computed(() => contabilidadInventoryKeys.items(params.value)),
    queryFn: () => inventoryRepository.listItems(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateInventoryItemBody) => inventoryRepository.createItem(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contabilidadInventoryKeys.root })
      void markapAlert.toast.success('Ítem registrado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useContabilidadInventoryMovements(params: Ref<Record<string, string | undefined>>) {
  return useQuery({
    queryKey: computed(() => contabilidadInventoryKeys.movements(params.value)),
    queryFn: () => inventoryRepository.listMovements(params.value),
    enabled: computed(() => Boolean(params.value.periodId || params.value.itemId)),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateInventoryMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateInventoryMovementBody) => inventoryRepository.createMovement(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contabilidadInventoryKeys.root })
      void markapAlert.toast.success('Movimiento registrado con asiento')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useContabilidadInventoryKardex(itemId: Ref<string | undefined>) {
  return useQuery({
    queryKey: computed(() => contabilidadInventoryKeys.kardex(itemId.value)),
    queryFn: () => inventoryRepository.getKardex(itemId.value!),
    enabled: computed(() => Boolean(itemId.value)),
    staleTime: 10_000,
  })
}

export function useContabilidadInventoryValuedBalance() {
  return useQuery({
    queryKey: contabilidadInventoryKeys.valued(),
    queryFn: () => inventoryRepository.getValuedBalance(),
    staleTime: 10_000,
  })
}
