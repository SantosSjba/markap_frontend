import { computed, ref, watch, type Ref } from 'vue'
import { formatCurrency } from '@shared/utils/formatters'

/** Monto con el símbolo de su moneda (S/ 1,200.00 · US$ 300.00). */
export function formatMoney(value: number, currency: string): string {
  return formatCurrency(value, currency)
}

/** Urgencia según los días que le quedan al contrato (1, 2 y 3 meses). */
export function daysLeftVariant(daysLeft: number): 'error' | 'warning' | 'info' | 'success' {
  if (daysLeft <= 30) return 'error'
  if (daysLeft <= 60) return 'warning'
  if (daysLeft <= 90) return 'info'
  return 'success'
}

export function daysLeftLabel(daysLeft: number): string {
  if (daysLeft <= 0) return 'Vence hoy'
  return daysLeft === 1 ? '1 día' : `${daysLeft} días`
}

/** Paginación local de un listado ya cargado; vuelve a la página 1 si cambian las filas. */
export function useLocalPagination<T>(rows: Ref<T[]>, initialSize = 10) {
  const currentPage = ref(1)
  const pageSize = ref(initialSize)
  watch(
    () => rows.value.length,
    () => {
      currentPage.value = 1
    },
  )
  const pageRows = computed(() =>
    rows.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value),
  )
  const paginationProps = computed(() => {
    const totalPages = Math.max(1, Math.ceil(rows.value.length / pageSize.value))
    return {
      currentPage: currentPage.value,
      totalPages,
      totalItems: rows.value.length,
      pageSize: pageSize.value,
      hasPrevPage: currentPage.value > 1,
      hasNextPage: currentPage.value < totalPages,
    }
  })
  function setPage(page: number) {
    currentPage.value = page
  }
  function setPageSize(size: number) {
    pageSize.value = size
    currentPage.value = 1
  }
  return { pageRows, paginationProps, setPage, setPageSize }
}
