export const CONTABILIDAD_JOURNAL_TEMPLATES_APP_SLUG = 'contabilidad'

export interface ContabilidadJournalTemplateLineDTO {
  id: string
  lineNumber: number
  accountId: string
  accountCode: string
  accountName: string
  defaultDebit: string
  defaultCredit: string
  costCenterId: string | null
  costCenterCode: string | null
  costCenterName: string | null
  description: string | null
}

export interface ContabilidadJournalTemplateDTO {
  id: string
  name: string
  description: string | null
  isActive: boolean
  lines: ContabilidadJournalTemplateLineDTO[]
  createdAt: string
  updatedAt: string
}

export interface JournalTemplateLineInput {
  accountId: string
  defaultDebit?: number | string
  defaultCredit?: number | string
  costCenterId?: string | null
  description?: string | null
}

export interface CreateJournalTemplateBody {
  name: string
  description?: string | null
  isActive?: boolean
  lines: JournalTemplateLineInput[]
}

export interface UpdateJournalTemplateBody {
  name?: string
  description?: string | null
  isActive?: boolean
  lines?: JournalTemplateLineInput[]
}

export interface JournalTemplateLineFormRow {
  key: string
  accountId: string
  defaultDebit: string
  defaultCredit: string
  costCenterId: string
  description: string
}

export function newJournalTemplateLineRow(): JournalTemplateLineFormRow {
  return {
    key: crypto.randomUUID(),
    accountId: '',
    defaultDebit: '',
    defaultCredit: '',
    costCenterId: '',
    description: '',
  }
}

export function linesFromTemplate(template: ContabilidadJournalTemplateDTO): JournalTemplateLineFormRow[] {
  if (!template.lines.length) return [newJournalTemplateLineRow(), newJournalTemplateLineRow()]
  return template.lines.map((line) => ({
    key: line.id,
    accountId: line.accountId,
    defaultDebit: line.defaultDebit !== '0.00' ? line.defaultDebit : '',
    defaultCredit: line.defaultCredit !== '0.00' ? line.defaultCredit : '',
    costCenterId: line.costCenterId ?? '',
    description: line.description ?? '',
  }))
}

export interface ApplyJournalTemplateResultDTO {
  templateId: string
  templateName: string
  description: string
  lines: {
    lineNumber: number
    accountId: string
    accountCode: string
    accountName: string
    debit: string
    credit: string
    costCenterId: string | null
    description: string | null
  }[]
}

export function linesToBody(lines: JournalTemplateLineFormRow[]): JournalTemplateLineInput[] {
  return lines
    .filter((line) => line.accountId)
    .map((line) => ({
      accountId: line.accountId,
      defaultDebit: line.defaultDebit || '0',
      defaultCredit: line.defaultCredit || '0',
      costCenterId: line.costCenterId || null,
      description: line.description.trim() || null,
    }))
}
