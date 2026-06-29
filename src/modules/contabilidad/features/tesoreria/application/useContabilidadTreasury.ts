import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type {
  CreateTreasuryMovementBody,
  CreateTreasuryTransferBody,
  ListTreasuryMovementsParams,
} from '../domain/treasury.types'
import { contabilidadTreasuryApiRepository as treasuryRepository } from '../infrastructure/repositories/contabilidad-treasury.api.repository'

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
  return invalidateQuerySubtree(qc, contabilidadTreasuryKeys.root)
}

export function useContabilidadCashBoxes() {
  return useQuery({
    queryKey: contabilidadTreasuryKeys.cashBoxes(),
    queryFn: () => treasuryRepository.listCashBoxes(),
    staleTime: 10_000,
  })
}

export function useContabilidadBankAccounts() {
  return useQuery({
    queryKey: contabilidadTreasuryKeys.bankAccounts(),
    queryFn: () => treasuryRepository.listBankAccounts(),
    staleTime: 10_000,
  })
}

export function useContabilidadTreasuryMovements(params: Ref<ListTreasuryMovementsParams>) {
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
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTreasuryMovementBody) => treasuryRepository.createMovement(body),
    onSuccess: () => {
      void invalidateContabilidadTreasuryCache(qc)
      void markapAlert.toast.success('Movimiento registrado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useContabilidadCreateTreasuryTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTreasuryTransferBody) => treasuryRepository.createTransfer(body),
    onSuccess: () => {
      void invalidateContabilidadTreasuryCache(qc)
      void markapAlert.toast.success('Transferencia registrada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo transferir', getApiErrorMessage(e)),
  })
}

export function useContabilidadCreateBankAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: treasuryRepository.createBankAccount,
    onSuccess: () => {
      void invalidateContabilidadTreasuryCache(qc)
      void markapAlert.toast.success('Cuenta bancaria creada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo crear', getApiErrorMessage(e)),
  })
}

export function useContabilidadUpsertReconciliation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: treasuryRepository.upsertReconciliation,
    onSuccess: () => {
      void invalidateContabilidadTreasuryCache(qc)
      void markapAlert.toast.success('Conciliación guardada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useContabilidadToggleReconciledMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { reconciliationId: string; movementId: string; reconciled: boolean }) =>
      treasuryRepository.toggleMovementReconciled(args.reconciliationId, args.movementId, args.reconciled),
    onSuccess: () => void invalidateContabilidadTreasuryCache(qc),
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}

export function useContabilidadCloseReconciliation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => treasuryRepository.closeReconciliation(id),
    onSuccess: () => {
      void invalidateContabilidadTreasuryCache(qc)
      void markapAlert.toast.success('Conciliación cerrada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo cerrar', getApiErrorMessage(e)),
  })
}
