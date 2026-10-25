export const CONTABILIDAD_PLE_APP_SLUG = 'contabilidad'

export interface ContabilidadPleBookDTO {
  code: string
  name: string
  description: string
  sunatStructure: string
}

export interface ContabilidadPleValidationIssueDTO {
  severity: 'error' | 'warning'
  bookCode: string
  code: string
  message: string
  context?: string
  lineNumber?: number
  linePreview?: string
}

export interface ContabilidadPleGeneratedFileDTO {
  bookCode: string
  bookName: string
  fileName: string
  lineCount: number
  content: string
  issues: ContabilidadPleValidationIssueDTO[]
}

export interface ContabilidadPleGenerateResultDTO {
  periodId: string
  year: number
  month: number
  ruc: string
  legalName: string
  files: ContabilidadPleGeneratedFileDTO[]
  errors: ContabilidadPleValidationIssueDTO[]
  warnings: ContabilidadPleValidationIssueDTO[]
  generatedAt: string
  blocked: boolean
  exportLogId?: string
}

export interface ContabilidadPleMandatoryProfileDTO {
  taxRegime: string
  taxRegimeLabel: string
  mandatoryBookCodes: string[]
  optionalBookCodes: string[]
  books: { code: string; name: string; mandatory: boolean }[]
}

export interface ContabilidadPleExportLogDTO {
  id: string
  periodId: string
  year: number
  month: number
  userId: string | null
  bookCodes: string[]
  fileCount: number
  zipHash: string
  errorCount: number
  warningCount: number
  status: string
  createdAt: string
}

export interface ContabilidadLibroMayorLineDTO {
  accountId: string
  accountCode: string
  accountName: string
  entryDate: string
  entryNumber: number
  description: string
  debit: string
  credit: string
  runningBalance: string
}

export interface ContabilidadLibroMayorAccountDTO {
  accountId: string
  accountCode: string
  accountName: string
  totalDebit: string
  totalCredit: string
  balance: string
  lines: ContabilidadLibroMayorLineDTO[]
}

export const PLE_EXPORT_STATUS_LABELS: Record<string, string> = {
  SUCCESS: 'Exitoso',
  WITH_WARNINGS: 'Con advertencias',
  BLOCKED: 'Bloqueado',
}
