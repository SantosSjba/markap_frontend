<script setup lang="ts">
import { computed } from 'vue'
import FormSelect from '../forms/FormSelect.vue'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../ui/pagination'
/**
 * BasePagination — pie de tabla de TailAdmin (`CardFooter` de las tablas básicas):
 * texto de resultados, selector de tamaño y botones outline.
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

const startItem = computed(() =>
  Math.min((props.currentPage - 1) * props.pageSize + 1, props.totalItems),
)
// Las flechas se deshabilitan también en la primera y la última página,
// aunque la vista no envíe hasPrevPage / hasNextPage.
const canPrev = computed(() => props.hasPrevPage && props.currentPage > 1)
const canNext = computed(() => props.hasNextPage && props.currentPage < props.totalPages)
const endItem = computed(() => Math.min(props.currentPage * props.pageSize, props.totalItems))

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

const pageSizeOptionsForSelect = computed(() =>
  props.pageSizeOptions.map((size) => ({ value: size, label: String(size) })),
)

const onPageSizeChange = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return
  emit('update:pageSize', Number(value))
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-between gap-3 px-5 py-4 sm:flex-row sm:px-6"
  >
    <!-- Info text -->
    <p class="order-2 text-sm text-gray-500 sm:order-1 dark:text-gray-400">
      <span v-if="totalItems > 0">
        Mostrando
        <span class="font-medium text-gray-800 dark:text-white/90">{{ startItem }}-{{ endItem }}</span>
        de
        <span class="font-medium text-gray-800 dark:text-white/90">{{ totalItems }}</span>
        resultados
      </span>
      <span v-else>No hay resultados</span>
    </p>

    <div class="order-1 flex flex-wrap items-center justify-center gap-4 sm:order-2">
      <!-- Page size selector -->
      <div v-if="showPageSize && totalItems > 0" class="flex items-center gap-2">
        <span class="shrink-0 text-sm text-gray-500 dark:text-gray-400">Por página:</span>
        <div class="w-20 shrink-0">
          <FormSelect
            :model-value="pageSize"
            :options="pageSizeOptionsForSelect"
            placeholder=""
            aria-label="Resultados por página"
            @update:model-value="onPageSizeChange"
          />
        </div>
      </div>

      <!-- Mobile (< sm) -->
      <div v-if="totalPages > 1" class="flex items-center gap-2 sm:hidden">
        <PaginationPrevious
          href="#"
          size="icon"
          variant="outline"
          aria-label="Página anterior"
          :disabled="!canPrev"
          @click.prevent="goToPage(currentPage - 1)"
        />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-400">
          {{ currentPage }}/{{ totalPages }}
        </span>
        <PaginationNext
          href="#"
          size="icon"
          variant="outline"
          aria-label="Página siguiente"
          :disabled="!canNext"
          @click.prevent="goToPage(currentPage + 1)"
        />
      </div>

      <!-- Desktop (>= sm) -->
      <Pagination v-if="totalPages > 1" class="mx-0 hidden w-auto sm:flex" aria-label="Paginación">
        <PaginationContent class="gap-1.5">
          <PaginationItem>
            <PaginationPrevious
              href="#"
              size="icon"
              variant="outline"
              aria-label="Página anterior"
              :disabled="!canPrev"
              @click.prevent="goToPage(currentPage - 1)"
            />
          </PaginationItem>
          <template v-for="(pageNum, index) in pageNumbers" :key="index">
            <PaginationItem v-if="pageNum === 'ellipsis'">
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem v-else>
              <PaginationLink
                href="#"
                size="icon"
                variant="outline"
                :is-active="pageNum === currentPage"
                :aria-label="`Página ${pageNum}`"
                @click.prevent="goToPage(pageNum)"
              >
                {{ pageNum }}
              </PaginationLink>
            </PaginationItem>
          </template>
          <PaginationItem>
            <PaginationNext
              href="#"
              size="icon"
              variant="outline"
              aria-label="Página siguiente"
              :disabled="!canNext"
              @click.prevent="goToPage(currentPage + 1)"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  </div>
</template>
