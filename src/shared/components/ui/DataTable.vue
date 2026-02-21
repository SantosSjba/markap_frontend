<script setup lang="ts">
/**
 * DataTable - Tabla reutilizable con cabeceras configurables y slot por fila
 */
interface Column {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
}

interface Props {
  columns: Column[]
  data: unknown[]
  /** Nombre del campo usado como key en cada fila (default: id) */
  rowKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
})

const getRowId = (row: unknown) => (row as Record<string, unknown>)[props.rowKey] as string

const alignClass = (align?: string) => {
  switch (align) {
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    default:
      return 'text-left'
  }
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[600px]" :style="{ color: 'var(--color-text-primary)' }">
      <thead>
        <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
          <th
            v-for="col in columns"
            :key="col.key"
            :class="['py-3 px-4 text-sm font-medium', alignClass(col.align)]"
            :style="{ color: 'var(--color-text-secondary)' }"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in data"
          :key="getRowId(row) || index"
          :style="{ borderBottom: '1px solid var(--color-border)' }"
          class="hover:bg-[var(--color-hover)] transition-colors"
        >
          <slot name="row" :row="row" :columns="columns" />
        </tr>
      </tbody>
    </table>
  </div>
</template>
