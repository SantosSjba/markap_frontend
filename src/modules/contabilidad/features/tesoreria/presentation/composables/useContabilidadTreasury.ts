import { contabilidadTreasuryRepositoryKey as treasuryRepositoryKey } from '../../application/ports/contabilidad-treasury.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import type {
  CreateTreasuryMovementBody,
  CreateTreasuryTransferBody,
  ListTreasuryMovementsParams,
} from '../../domain/treasury.types'
export const contabilidadTreasuryKeys = {
  root: ['contabilidad-treasury'] as const,
  cashBoxes: () => [...contabilidadTreasuryKeys.root, 'cash-boxes'] as const,
  bankAccounts: () => [...contabilidadTreasuryKeys.root, 'bank-accounts'] as const,
  movements: (params: ListTreasuryMovementsParams) =>
    [...contabilidadTreasuryKeys.root, 'movements', params] as const,
  reconciliation: (bankAccountId: string, periodId: string) =>
    [...contabilidadTreasuryKeys.root, 'reconciliation', bankAccountId, periodId] as const,
}

export function invalidateContabilidadTreasuryCache(qc: QueryClient) {
  return invalidateModuleQueries(qc, 'contabilidad')
}

export function useContabilidadCashBoxes() {
  const treasuryRepository = useService(treasuryRepositoryKey)
  return useQuery({
    queryKey: contabilidadTreasuryKeys.cashBoxes(),
    queryFn: () => treasuryRepository.listCashBoxes(),
    staleTime: 10_000,
  })
}

export function useContabilidadBankAccounts() {
  const treasuryRepository = useService(treasuryRepositoryKey)
  return useQuery({
    queryKey: contabilidadTreasuryKeys.bankAccounts(),
    queryFn: () => treasuryRepository.listBankAccounts(),
    staleTime: 10_000,
  })
}

export function useContabilidadTreasuryMovements(params: Ref<ListTreasuryMovementsParams>) {
  const treasuryRepository = useService(treasuryRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadTreasuryKeys.movements(params.value)),
    queryFn: () => treasuryRepository.listMovements(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadBankReconciliation(
  bankAccountId: Ref<string | undefined>,
  periodId: Ref<string | undefined>,
) {
  const treasuryRepository = useService(treasuryRepositoryKey)
  return useQuery({
    queryKey: computed(() =>
      contabilidadTreasuryKeys.reconciliation(bankAccountId.value ?? '', periodId.value ?? ''),
    ),
    queryFn: () => treasuryRepository.getReconciliation(bankAccountId.value!, periodId.value!),
    enabled: computed(() => Boolean(bankAccountId.value && periodId.value)),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateTreasuryMovement() {
  const treasuryRepository = useService(treasuryRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTreasuryMovementBody) => treasuryRepository.createMovement(body),
    onSuccess: async () => {
      await invalidateContabilidadTreasuryCache(qc)
      void markapAlert.toast.success('Movimiento registrado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useContabilidadCreateTreasuryTransfer() {
  const treasuryRepository = useService(treasuryRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTreasuryTransferBody) => treasuryRepository.createTransfer(body),
    onSuccess: async () => {
      await invalidateContabilidadTreasuryCache(qc)
      void markapAlert.toast.success('Transferencia registrada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo transferir', getApiErrorMessage(e)),
  })
}

export function useContabilidadCreateBankAccount() {
  const treasuryRepository = useService(treasuryRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: treasuryRepository.createBankAccount,
    onSuccess: async () => {
      await invalidateContabilidadTreasuryCache(qc)
      void markapAlert.toast.success('Cuenta bancaria creada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo crear', getApiErrorMessage(e)),
  })
}

export function useContabilidadUpsertReconciliation() {
  const treasuryRepository = useService(treasuryRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: treasuryRepository.upsertReconciliation,
    onSuccess: async () => {
      await invalidateContabilidadTreasuryCache(qc)
      void markapAlert.toast.success('Conciliación guardada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useContabilidadToggleReconciledMovement() {
  const treasuryRepository = useService(treasuryRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { reconciliationId: string; movementId: string; reconciled: boolean }) =>
      treasuryRepository.toggleMovementReconciled(
        args.reconciliationId,
        args.movementId,
        args.reconciled,
      ),
    onSuccess: async () => await invalidateContabilidadTreasuryCache(qc),
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}

export function useContabilidadCloseReconciliation() {
  const treasuryRepository = useService(treasuryRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => treasuryRepository.closeReconciliation(id),
    onSuccess: async () => {
      await invalidateContabilidadTreasuryCache(qc)
      void markapAlert.toast.success('Conciliación cerrada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo cerrar', getApiErrorMessage(e)),
  })
}
