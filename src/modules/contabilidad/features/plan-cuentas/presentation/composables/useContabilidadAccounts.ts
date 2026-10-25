import { contabilidadAccountsRepositoryKey as accountsRepositoryKey } from '../../application/ports/contabilidad-accounts.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import type {
  CreateContabilidadAccountBody,
  UpdateContabilidadAccountBody,
} from '../../domain/account.types'
export const contabilidadAccountsKeys = {
  root: ['contabilidad-accounts'] as const,
  tree: (search?: string) => [...contabilidadAccountsKeys.root, 'tree', search ?? ''] as const,
  pcgeClasses: () => [...contabilidadAccountsKeys.root, 'pcge-classes'] as const,
}

export function invalidateContabilidadAccountsCache(qc: QueryClient) {
  return invalidateModuleQueries(qc, 'contabilidad')
}

export function useContabilidadAccountsTree(search: Ref<string>) {
  const accountsRepository = useService(accountsRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadAccountsKeys.tree(search.value)),
    queryFn: () => accountsRepository.listTree(search.value || undefined),
    staleTime: 15_000,
  })
}

export function useContabilidadCreateAccount() {
  const accountsRepository = useService(accountsRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateContabilidadAccountBody) => accountsRepository.create(body),
    onSuccess: async () => {
      await invalidateContabilidadAccountsCache(qc)
      void markapAlert.toast.success('Cuenta creada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo crear', getApiErrorMessage(e)),
  })
}

export function useContabilidadUpdateAccount() {
  const accountsRepository = useService(accountsRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; body: UpdateContabilidadAccountBody }) =>
      accountsRepository.update(args.id, args.body),
    onSuccess: async () => {
      await invalidateContabilidadAccountsCache(qc)
      void markapAlert.toast.success('Cuenta actualizada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}

export function useContabilidadDeactivateAccount() {
  const accountsRepository = useService(accountsRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => accountsRepository.deactivate(id),
    onSuccess: async () => {
      await invalidateContabilidadAccountsCache(qc)
      void markapAlert.toast.success('Cuenta desactivada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo desactivar', getApiErrorMessage(e)),
  })
}

export function useContabilidadPcgeClasses() {
  const accountsRepository = useService(accountsRepositoryKey)
  return useQuery({
    queryKey: contabilidadAccountsKeys.pcgeClasses(),
    queryFn: () => accountsRepository.getPcgeClasses(),
    staleTime: 60_000,
  })
}

export function useContabilidadImportPcge() {
  const accountsRepository = useService(accountsRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (classes: string) => accountsRepository.importPcge(classes),
    onSuccess: async (result) => {
      await invalidateContabilidadAccountsCache(qc)
      void markapAlert.toast.success(
        `Importación PCGE: ${result.created} creadas, ${result.skipped} omitidas`,
      )
    },
    onError: (e) => void markapAlert.toast.error('No se pudo importar', getApiErrorMessage(e)),
  })
}
