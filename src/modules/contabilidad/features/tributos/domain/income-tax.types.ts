export const CONTABILIDAD_INCOME_TAX_APP_SLUG = 'contabilidad'

export interface ContabilidadIncomeTaxSummaryDTO {
  periodId: string
  year: number
  month: number
  totalIncome: string
  totalExpenses: string
  netIncomeBeforeTax: string
  rentaAccountBalance: string
  estimatedTaxProvision: string
}
