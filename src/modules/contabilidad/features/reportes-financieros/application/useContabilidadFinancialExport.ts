import { ref } from 'vue'
import { useExcelExport } from '@/shared/composables/useExcelExport'
import { markapAlert } from '@/shared/composables'
import { contabilidadFinancialApiRepository as financialRepository } from '../infrastructure/repositories/contabilidad-financial.api.repository'

export type FinancialExportKind = 'balance-sheet' | 'income-statement' | 'cash-flow'

const exportFns: Record<FinancialExportKind, (periodId: string) => ReturnType<typeof financialRepository.exportBalanceSheet>> = {
  'balance-sheet': (periodId) => financialRepository.exportBalanceSheet(periodId),
  'income-statement': (periodId) => financialRepository.exportIncomeStatement(periodId),
  'cash-flow': (periodId) => financialRepository.exportCashFlowStatement(periodId),
}

export function useContabilidadFinancialExport() {
  const { exportToExcel, isExportingKey } = useExcelExport()
  const exportingKind = ref<FinancialExportKind | null>(null)

  async function exportFinancialStatement(kind: FinancialExportKind, periodId: string) {
    if (!periodId || isExportingKey(kind)) return
    exportingKind.value = kind
    try {
      const payload = await exportFns[kind](periodId)
      await exportToExcel(
        {
          fileName: payload.fileName,
          sheetName: payload.sheetName,
          columns: payload.columns,
          rows: payload.rows,
        },
        kind,
      )
      void markapAlert.toast.success('Exportación generada')
    } catch {
      void markapAlert.toast.error('No se pudo exportar el reporte')
    } finally {
      exportingKind.value = null
    }
  }

  function isExporting(kind: FinancialExportKind): boolean {
    return isExportingKey(kind)
  }

  return { exportFinancialStatement, isExporting }
}
