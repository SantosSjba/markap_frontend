import { ref } from 'vue'
import ExcelJS from 'exceljs'
import { markapAlert } from '@/shared/alert'

export type ExcelColumn = {
  header: string
  key: string
  width?: number
}

export type ExcelRow = Record<string, string | number | boolean | null | undefined>

export interface ExcelSheetOptions {
  sheetName: string
  columns: ExcelColumn[]
  rows: ExcelRow[]
}

export interface ExcelExportOptions extends ExcelSheetOptions {
  fileName: string
  additionalSheets?: ExcelSheetOptions[]
}

function addSheetToWorkbook(workbook: ExcelJS.Workbook, opts: ExcelSheetOptions): void {
  const { sheetName, columns, rows } = opts
  const sheet = workbook.addWorksheet(sheetName)

  sheet.columns = columns.map((col) => ({
    key: col.key,
    width: col.width ?? 18,
  }))

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

  rows.forEach((rowData, idx) => {
    const values = columns.map((c) => rowData[c.key] ?? '')
    const row = sheet.addRow(values)
    row.height = 18
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

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  }
}

async function generateExcel(options: ExcelExportOptions): Promise<void> {
  const { fileName, additionalSheets } = options

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'MARKAP'
  workbook.created = new Date()

  addSheetToWorkbook(workbook, options)

  if (additionalSheets) {
    for (const sheet of additionalSheets) {
      addSheetToWorkbook(workbook, sheet)
    }
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
      const msg = (err as Error)?.message ?? 'Error al exportar'
      exportError.value = msg
      void markapAlert.toast.error('Exportación fallida', msg)
      console.error('[useExcelExport]', err)
    } finally {
      isExporting.value = false
    }
  }

  return { isExporting, exportError, exportToExcel }
}
