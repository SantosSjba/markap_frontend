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

export function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadAllPleFiles(files: ContabilidadPleGeneratedFileDTO[]) {
  for (const file of files) {
    downloadTextFile(file.fileName, file.content)
  }
}
