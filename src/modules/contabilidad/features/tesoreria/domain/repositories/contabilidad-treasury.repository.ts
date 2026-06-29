import type {
  ContabilidadBankAccountDTO,
  ContabilidadBankReconciliationDTO,
  ContabilidadCashBoxDTO,
  ContabilidadTreasuryMovementDTO,
  CreateTreasuryMovementBody,
  CreateTreasuryTransferBody,
  ListTreasuryMovementsParams,
} from '../treasury.types'

export interface ContabilidadTreasuryRepository {
  listCashBoxes(): Promise<{ cashBoxes: ContabilidadCashBoxDTO[] }>
  listBankAccounts(): Promise<{ bankAccounts: ContabilidadBankAccountDTO[] }>
  createBankAccount(body: {
    code: string
    bankName: string
    accountNumber: string
    cci?: string | null
    currency?: string
    accountId: string
  }): Promise<ContabilidadBankAccountDTO>
  updateBankAccount(
    id: string,
    body: Partial<{
      code: string
      bankName: string
      accountNumber: string
      cci: string | null
      currency: string
      isActive: boolean
    }>,
  ): Promise<ContabilidadBankAccountDTO>
  listMovements(params: ListTreasuryMovementsParams): Promise<{
    movements: ContabilidadTreasuryMovementDTO[]
    movementTypeLabels: Record<string, string>
  }>
  createMovement(body: CreateTreasuryMovementBody): Promise<ContabilidadTreasuryMovementDTO>
  createTransfer(body: CreateTreasuryTransferBody): Promise<{ movements: ContabilidadTreasuryMovementDTO[] }>
  getReconciliation(
    bankAccountId: string,
    periodId: string,
  ): Promise<{
    reconciliation: ContabilidadBankReconciliationDTO | null
    movements: ContabilidadTreasuryMovementDTO[]
  }>
  upsertReconciliation(body: {
    bankAccountId: string
    periodId: string
    statementBalance: number | string
    notes?: string | null
  }): Promise<ContabilidadBankReconciliationDTO>
  toggleMovementReconciled(
    reconciliationId: string,
    movementId: string,
    reconciled: boolean,
  ): Promise<ContabilidadBankReconciliationDTO>
  closeReconciliation(id: string): Promise<ContabilidadBankReconciliationDTO>
}
