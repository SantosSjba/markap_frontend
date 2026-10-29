import { computed, ref, unref, type Ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import {
  dropTarget,
  indentTarget,
  insertPositionAfter,
  outdentTarget,
  visibleRows,
  type DropZone,
} from '../../domain/budget-sheet-editing'
import type {
  CreateBudgetRowsPayload,
  BudgetRowFields,
  BudgetRowKind,
  BudgetSheetDto,
  BudgetSheetRowDto,
  UpdateBudgetHeaderPayload,
} from '../../domain/project-budget.types'
import { applyBudgetSheet, projectBudgetKeys, useBudgetRepository } from './useProjectBudget'

/**
 * Estado y acciones del editor tipo hoja. Cada cambio se envía al salir de la celda y se encola
 * (uno a la vez, en el orden en que se hicieron); la hoja que responde el servidor reemplaza la
 * caché, así códigos, subtotales y totales siempre vienen recalculados. Si algo falla se avisa y
 * se vuelve a pedir la hoja para descartar el cambio.
 */
export function useBudgetSheet(projectId: Ref<string> | string, sheet: Ref<BudgetSheetDto>) {
  const repo = useBudgetRepository()
  const qc = useQueryClient()
  const pid = () => unref(projectId)

  const pending = ref(0)
  const saving = computed(() => pending.value > 0)
  let queue: Promise<unknown> = Promise.resolve()

  function run<T extends BudgetSheetDto>(task: () => Promise<T>): Promise<T | null> {
    pending.value++
    const next = queue.then(async () => {
      try {
        const result = await task()
        applyBudgetSheet(qc, pid(), result)
        return result
      } catch (err) {
        void markapAlert.toast.error('No se guardó el cambio', getApiErrorMessage(err))
        await qc.invalidateQueries({ queryKey: projectBudgetKeys.budget(pid()) })
        return null
      } finally {
        pending.value--
      }
    })
    queue = next
    return next
  }

  // ── Plegado ──
  const collapsed = ref(new Set<string>())
  const rows = computed(() => visibleRows(sheet.value.rows, collapsed.value))
  function toggle(rowId: string) {
    const next = new Set(collapsed.value)
    if (next.has(rowId)) next.delete(rowId)
    else next.add(rowId)
    collapsed.value = next
  }
  const expand = (rowId: string | null) => {
    if (rowId && collapsed.value.has(rowId)) toggle(rowId)
  }

  // ── Celdas y filas ──
  const updateRow = (rowId: string, patch: BudgetRowFields) =>
    run(() => repo.updateRow(pid(), rowId, patch))

  const updateHeader = (patch: UpdateBudgetHeaderPayload) =>
    run(() => repo.updateHeader(pid(), patch))

  /** Agrega filas debajo de `afterRowId` (Enter / pegar) y devuelve los ids nuevos */
  async function insertRows(afterRowId: string | null, newRows: BudgetRowFields[]) {
    const position = insertPositionAfter(sheet.value.rows, afterRowId)
    return createRows({ ...position, rows: newRows })
  }

  /** Inserción en un grupo elegido, compartida por el editor y el selector de catálogo. */
  async function createRows(payload: CreateBudgetRowsPayload) {
    expand(payload.parentId)
    const result = await run(() => repo.createRows(pid(), payload))
    return result?.createdRowIds ?? []
  }

  const addRow = async (afterRowId: string | null, kind: BudgetRowKind = 'ITEM') =>
    (await insertRows(afterRowId, [{ kind, description: '' }]))[0] ?? null

  /** Agrega un grupo al nivel de la fila (no dentro de ella) */
  async function addSiblingGroup(rowId: string) {
    const row = sheet.value.rows.find((r) => r.id === rowId)
    if (!row) return null
    const result = await run(() =>
      repo.createRows(pid(), {
        parentId: row.parentId,
        afterRowId: row.id,
        rows: [{ kind: 'GROUP', description: '' }],
      }),
    )
    return result?.createdRowIds[0] ?? null
  }

  async function duplicateRow(rowId: string) {
    const r = sheet.value.rows.find((x) => x.id === rowId)
    if (!r || r.kind === 'GROUP') return null
    const result = await run(() =>
      repo.createRows(pid(), {
        parentId: r.parentId,
        afterRowId: r.id,
        rows: [
          {
            kind: r.kind,
            description: r.description,
            unit: r.unit,
            quantity: r.quantity,
            unitPrice: r.unitPrice,
            directCost: r.directCost,
            utilityPctOverride: r.utilityPctOverride,
            hasIgv: r.hasIgv,
            note: r.note,
          },
        ],
      }),
    )
    return result?.createdRowIds[0] ?? null
  }

  /** Devuelve `null` si no se puede indentar; si no, la promesa del guardado */
  function indent(rowId: string) {
    const target = indentTarget(sheet.value.rows, rowId)
    if (!target) return null
    expand(target.parentId)
    return run(() => repo.moveRow(pid(), rowId, target))
  }

  function outdent(rowId: string) {
    const target = outdentTarget(sheet.value.rows, rowId)
    if (!target) return null
    return run(() => repo.moveRow(pid(), rowId, target))
  }

  /** Arrastrar y soltar: a dónde iría la fila (`null` si no puede ir ahí o ya está en ese lugar) */
  const dropPreview = (rowId: string, overId: string, zone: DropZone) =>
    dropTarget(sheet.value.rows, rowId, overId, zone, !collapsed.value.has(overId))

  function dropOn(rowId: string, overId: string, zone: DropZone) {
    const target = dropPreview(rowId, overId, zone)
    if (!target) return false
    expand(target.parentId)
    void run(() => repo.moveRow(pid(), rowId, target))
    return true
  }

  function moveBy(rowId: string, delta: -1 | 1) {
    const row = sheet.value.rows.find((r) => r.id === rowId)
    if (!row) return
    const siblings = sheet.value.rows.filter((r) => r.parentId === row.parentId)
    const index = siblings.findIndex((r) => r.id === rowId) + delta
    if (index < 0 || index >= siblings.length) return
    void run(() => repo.moveRow(pid(), rowId, { parentId: row.parentId, index }))
  }

  async function removeRow(row: BudgetSheetRowDto) {
    if (row.kind === 'GROUP' && row.childrenCount > 0) {
      const ok = await markapAlert.confirm({
        title: 'Eliminar grupo',
        text: `«${row.description || row.code}» y las ${row.childrenCount} filas que contiene se eliminarán.`,
        icon: 'warning',
        confirmText: 'Eliminar',
        focusCancel: true,
      })
      if (!ok) return
    }
    await run(() => repo.deleteRow(pid(), row.id))
  }

  const addSupplierPayment = (rowId: string, payload: { amount: number; paidAt: string; note?: string | null }) =>
    run(() => repo.createSupplierPayment(pid(), rowId, payload))

  async function deleteSupplierPayment(paymentId: string) {
    const ok = await markapAlert.confirmDanger({
      title: 'Eliminar abono',
      text: '¿Eliminar este abono al proveedor?',
    })
    if (ok) await run(() => repo.deleteSupplierPayment(pid(), paymentId))
  }

  return {
    rows,
    addSupplierPayment,
    deleteSupplierPayment,
    saving,
    collapsed,
    toggle,
    updateRow,
    updateHeader,
    insertRows,
    createRows,
    addRow,
    addSiblingGroup,
    duplicateRow,
    indent,
    outdent,
    dropPreview,
    dropOn,
    moveBy,
    removeRow,
  }
}
