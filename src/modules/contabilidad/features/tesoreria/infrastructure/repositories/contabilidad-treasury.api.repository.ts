import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_TREASURY_APP_SLUG } from '../../domain/treasury.types'
import type {
  ContabilidadBankAccountDTO,
  ContabilidadBankReconciliationDTO,
  ContabilidadCashBoxDTO,
  ContabilidadTreasuryMovementDTO,
} from '../../domain/treasury.types'
import type { ContabilidadTreasuryRepository } from '../../domain/repositories/contabilidad-treasury.repository'

function qs(extra?: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  u.set('applicationSlug', CONTABILIDAD_TREASURY_APP_SLUG)
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== '') u.set(k, String(v))
    })
  }
  return u.toString()
}

export const contabilidadTreasuryApiRepository: ContabilidadTreasuryRepository = {
  listCashBoxes: () =>
    apiClient.get<{ cashBoxes: ContabilidadCashBoxDTO[] }>(`/contabilidad-treasury/cash-boxes?${qs()}`).then((r) => r.data),

  listBankAccounts: () =>
    apiClient
      .get<{ bankAccounts: ContabilidadBankAccountDTO[] }>(`/contabilidad-treasury/bank-accounts?${qs()}`)
      .then((r) => r.data),

  createBankAccount: (body) =>
    apiClient
      .post<ContabilidadBankAccountDTO>(`/contabilidad-treasury/bank-accounts?${qs()}`, body)
      .then((r) => r.data),

  updateBankAccount: (id, body) =>
    apiClient
      .patch<ContabilidadBankAccountDTO>(`/contabilidad-treasury/bank-accounts/${id}?${qs()}`, body)
      .then((r) => r.data),

  listMovements: (params) =>
    apiClient
      .get<{ movements: ContabilidadTreasuryMovementDTO[]; movementTypeLabels: Record<string, string> }>(
        `/contabilidad-treasury/movements?${qs(params as Record<string, string | undefined>)}`,
      )
      .then((r) => r.data),

  createMovement: (body) =>
    apiClient
      .post<ContabilidadTreasuryMovementDTO>(`/contabilidad-treasury/movements?${qs()}`, body)
      .then((r) => r.data),

  createTransfer: (body) =>
    apiClient
      .post<{ movements: ContabilidadTreasuryMovementDTO[] }>(`/contabilidad-treasury/transfers?${qs()}`, body)
      .then((r) => r.data),

  getReconciliation: (bankAccountId, periodId) =>
    apiClient
      .get<{
        reconciliation: ContabilidadBankReconciliationDTO | null
        movements: ContabilidadTreasuryMovementDTO[]
      }>(`/contabilidad-treasury/reconciliations?${qs({ bankAccountId, periodId })}`)
      .then((r) => r.data),

  upsertReconciliation: (body) =>
    apiClient
      .put<ContabilidadBankReconciliationDTO>(`/contabilidad-treasury/reconciliations?${qs()}`, body)
      .then((r) => r.data),

  toggleMovementReconciled: (reconciliationId, movementId, reconciled) =>
    apiClient
      .patch<ContabilidadBankReconciliationDTO>(
        `/contabilidad-treasury/reconciliations/${reconciliationId}/movements/${movementId}?${qs()}`,
        { reconciled },
      )
      .then((r) => r.data),

  closeReconciliation: (id) =>
    apiClient
      .patch<ContabilidadBankReconciliationDTO>(`/contabilidad-treasury/reconciliations/${id}/close?${qs()}`)
      .then((r) => r.data),
}
