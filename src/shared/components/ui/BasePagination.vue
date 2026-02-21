<script setup lang="ts">
import { computed } from 'vue'

/**
 * BasePagination Component
 * Reusable pagination component for tables and lists
 */

interface Props {
  /** Current page (1-based) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Total items count (for info display) */
  totalItems?: number
  /** Items per page (for info display) */
  pageSize?: number
  /** Whether previous button is enabled */
  hasPrevPage?: boolean
  /** Whether next button is enabled */
  hasNextPage?: boolean
  /** Show page size selector */
  showPageSize?: boolean
  /** Available page size options */
  pageSizeOptions?: number[]
  /** Max page numbers to show (e.g. 5 shows 1 ... 4 5 6 ... 10) */
  maxVisiblePages?: number
}

const props = withDefaults(defineProps<Props>(), {
  totalItems: 0,
  pageSize: 10,
  hasPrevPage: true,
  hasNextPage: true,
  showPageSize: false,
  pageSizeOptions: () => [5, 10, 20, 50],
  maxVisiblePages: 5,
})

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
}>()

const startItem = computed(
  () => (props.currentPage - 1) * props.pageSize + 1
)
const endItem = computed(() =>
  Math.min(props.currentPage * props.pageSize, props.totalItems)
)

const pageNumbers = computed(() => {
  const total = props.totalPages
  const current = props.currentPage
  const max = props.maxVisiblePages

  if (total <= max) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const half = Math.floor(max / 2)
  let start = Math.max(1, current - half)
  let end = Math.min(total, start + max - 1)

  if (end - start + 1 < max) {
    start = Math.max(1, end - max + 1)
  }

  const pages: (number | 'ellipsis')[] = []
  if (start > 1) {
    pages.push(1)
    if (start > 2) pages.push('ellipsis')
  }
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  if (end < total) {
    if (end < total - 1) pages.push('ellipsis')
    pages.push(total)
  }
  return pages
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('update:currentPage', page)
  }
}

const handlePageSizeChange = (event: Event) => {
  const value = parseInt((event.target as HTMLSelectElement).value, 10)
  emit('update:pageSize', value)
}
</script>

<template>
  <div
    class="flex flex-col sm:flex-row items-center justify-between gap-3"
    style="color: var(--color-text-secondary);"
  >
    <!-- Info text -->
    <div class="text-sm order-2 sm:order-1">
      <span v-if="totalItems > 0">
        Mostrando {{ startItem }}-{{ endItem }} de {{ totalItems }} resultados
      </span>
      <span v-else>
        No hay resultados
      </span>
    </div>

    <div class="flex items-center gap-4 order-1 sm:order-2">
      <!-- Page size selector -->
      <div v-if="showPageSize && totalItems > 0" class="flex items-center gap-2">
        <label class="text-sm" for="page-size">Por página:</label>
        <select
          id="page-size"
          :value="pageSize"
          class="rounded-lg border px-2 py-1.5 text-sm"
          style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text-primary);"
          @change="handlePageSizeChange"
        >
          <option
            v-for="size in pageSizeOptions"
            :key="size"
            :value="size"
          >
            {{ size }}
          </option>
        </select>
      </div>

      <!-- Pagination controls -->
      <nav
        v-if="totalPages > 1"
        class="flex items-center gap-1"
        aria-label="Paginación"
      >
        <button
          type="button"
          class="p-2 rounded-lg hover-surface disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!hasPrevPage"
          aria-label="Página anterior"
          @click="goToPage(currentPage - 1)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex items-center gap-1">
          <button
            v-for="(pageNum, index) in pageNumbers"
            :key="index"
            type="button"
            :class="[
              'min-w-[2.25rem] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              pageNum === 'ellipsis'
                ? 'cursor-default'
                : pageNum === currentPage
                  ? 'text-white'
                  : 'hover-surface',
            ]"
            :style="
              pageNum === currentPage
                ? { backgroundColor: 'var(--color-primary)' }
                : { color: 'var(--color-text-primary)' }
            "
            :disabled="pageNum === 'ellipsis'"
            @click="pageNum !== 'ellipsis' && goToPage(pageNum as number)"
          >
            {{ pageNum === 'ellipsis' ? '...' : pageNum }}
          </button>
        </div>

        <button
          type="button"
          class="p-2 rounded-lg hover-surface disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!hasNextPage"
          aria-label="Página siguiente"
          @click="goToPage(currentPage + 1)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </div>
  </div>
</template>
