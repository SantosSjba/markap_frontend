import { ref, computed, type Ref, type ComputedRef } from 'vue'

/**
 * usePagination Composable
 * Manages pagination state and logic
 */

interface UsePaginationOptions {
  initialPage?: number
  initialLimit?: number
}

interface UsePaginationReturn {
  page: Ref<number>
  limit: Ref<number>
  total: Ref<number>
  totalPages: ComputedRef<number>
  hasNextPage: ComputedRef<boolean>
  hasPrevPage: ComputedRef<boolean>
  setPage: (newPage: number) => void
  setLimit: (newLimit: number) => void
  setTotal: (newTotal: number) => void
  nextPage: () => void
  prevPage: () => void
  reset: () => void
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { initialPage = 1, initialLimit = 10 } = options

  const page = ref(initialPage)
  const limit = ref(initialLimit)
  const total = ref(0)

  const totalPages = computed(() => Math.ceil(total.value / limit.value))
  const hasNextPage = computed(() => page.value < totalPages.value)
  const hasPrevPage = computed(() => page.value > 1)

  const setPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages.value) {
      page.value = newPage
    }
  }

  const setLimit = (newLimit: number) => {
    limit.value = newLimit
    page.value = 1 // Reset to first page when changing limit
  }

  const setTotal = (newTotal: number) => {
    total.value = newTotal
  }

  const nextPage = () => {
    if (hasNextPage.value) {
      page.value++
    }
  }

  const prevPage = () => {
    if (hasPrevPage.value) {
      page.value--
    }
  }

  const reset = () => {
    page.value = initialPage
    limit.value = initialLimit
    total.value = 0
  }

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    setPage,
    setLimit,
    setTotal,
    nextPage,
    prevPage,
    reset,
  }
}
