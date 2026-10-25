import { contabilidadFinancialRepositoryKey as financialRepositoryKey } from '../../application/ports/contabilidad-financial.port'
import { useService } from '@shared/presentation/di/services'
import { ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { triggerBlobDownload } from '@shared/presentation/downloads/download-blob'
import type { FinancialExportFormat } from '../../domain/financial-export.types'
import type { FinancialExportKind } from '../../domain/financial-export.types'
export type { FinancialExportKind, FinancialExportFormat }

function parseFileName(disposition: string | undefined, fallback: string): string {
  const match = disposition?.match(/filename="?([^";\n]+)"?/i)
  return match?.[1]?.trim() || fallback
}

export function useContabilidadFinancialExport() {
  const financialRepository = useService(financialRepositoryKey)
  const exportingKey = ref<string | null>(null)

  async function exportFinancialStatement(
    kind: FinancialExportKind,
    periodId: string,
    format: FinancialExportFormat = 'excel',
    costCenterId?: string,
  ) {
    if (!periodId) return
    const key = `${format}:${kind}`
    if (exportingKey.value === key) return

    exportingKey.value = key
    try {
      const response = await financialRepository.downloadExport(
        format,
        kind,
        periodId,
        costCenterId,
      )
      const ext = format === 'pdf' ? 'pdf' : 'xlsx'
      const disposition =
        response.headers['content-disposition'] ?? response.headers['Content-Disposition']
      const fileName = parseFileName(
        typeof disposition === 'string' ? disposition : undefined,
        `${kind}-${periodId}.${ext}`,
      )
      triggerBlobDownload(response.data, fileName)
      void markapAlert.toast.success(format === 'pdf' ? 'PDF generado' : 'Excel generado')
    } catch {
      void markapAlert.toast.error('No se pudo exportar el reporte')
    } finally {
      exportingKey.value = null
    }
  }

  function isExporting(
    kind: FinancialExportKind,
    format: FinancialExportFormat = 'excel',
  ): boolean {
    return exportingKey.value === `${format}:${kind}`
  }

  return { exportFinancialStatement, isExporting }
}
