import { ref } from 'vue'
import ExcelJS from 'exceljs'

export type ExcelColumn = {
  header: string
  key: string
  width?: number
}

export type ExcelRow = Record<string, string | number | boolean | null | undefined>

export interface ExcelExportOptions {
  fileName: string
  sheetName: string
  columns: ExcelColumn[]
  rows: ExcelRow[]
}

async function generateExcel(options: ExcelExportOptions): Promise<void> {
  const { fileName, sheetName, columns, rows } = options

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'MARKAP'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(sheetName)

  // Definir anchos de columna sin asignar header (lo hacemos manualmente)
  sheet.columns = columns.map((col) => ({
    key: col.key,
    width: col.width ?? 18,
  }))

  // Fila 1 — encabezados escritos explícitamente
  const headerValues = columns.map((c) => c.header)
  const headerRow = sheet.addRow(headerValues)
  headerRow.height = 22
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF107C41' },
    }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF085D2E' } },
    }
  })

  // Filas de datos — agregar por array ordenado según columns
  rows.forEach((rowData, idx) => {
    const values = columns.map((c) => rowData[c.key] ?? '')
    const row = sheet.addRow(values)
    row.height = 18
    // Fondo alterno suave
    if (idx % 2 === 0) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF4F9F6' },
        }
      })
    }
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.alignment = { vertical: 'middle' }
      cell.border = {
        bottom: { style: 'hair', color: { argb: 'FFD1D5DB' } },
      }
    })
  })

  // Auto-filter sobre la fila de encabezados
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/**
 * Composable reutilizable para exportaciones Excel en cualquier vista.
 * `isExporting` se puede bindear directamente al prop `:loading` de BaseButton.
 */
export function useExcelExport() {
  const isExporting = ref(false)
  const exportError = ref<string | null>(null)

  async function exportToExcel(options: ExcelExportOptions) {
    isExporting.value = true
    exportError.value = null
    try {
      await generateExcel(options)
    } catch (err) {
      exportError.value = (err as Error)?.message ?? 'Error al exportar'
      console.error('[useExcelExport]', err)
    } finally {
      isExporting.value = false
    }
  }

  return { isExporting, exportError, exportToExcel }
}
