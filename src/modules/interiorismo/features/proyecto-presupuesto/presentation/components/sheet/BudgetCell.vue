<script setup lang="ts">
import { computed, ref } from 'vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
/**
 * BudgetCell — celda editable de la hoja. Sin foco muestra el valor formateado; con foco, el
 * valor crudo. Guarda al salir o con Enter (solo si cambió); Esc deshace. ↑/↓ avisan para
 * moverse de fila; Enter avisa para crear la fila siguiente; pegar varias líneas se delega.
 */

const props = withDefaults(
  defineProps<{
    value: string
    display?: string
    placeholder?: string
    align?: 'left' | 'right' | 'center'
    readonly?: boolean
    rowId: string
    col: string
    inputClass?: string
    title?: string
  }>(),
  { display: undefined, placeholder: '', align: 'left', readonly: false, inputClass: '', title: undefined },
)

const emit = defineEmits<{
  commit: [value: string]
  move: [delta: -1 | 1]
  enter: []
  tab: [shift: boolean]
  paste: [text: string]
}>()

const columnLabels: Record<string, string> = {
  code: 'Código', description: 'Descripción', unit: 'Unidad', quantity: 'Metrado',
  unitPrice: 'Precio unitario', cost: 'Costo', actualCost: 'Costo real',
  utilityPct: 'Utilidad %', note: 'Nota',
}
const focused = ref(false)
const draft = ref('')
const input = ref<HTMLInputElement | null>(null)
const shown = computed(() => (focused.value ? draft.value : (props.display ?? props.value)))

function onFocus(event: FocusEvent) {
  input.value = event.target as HTMLInputElement
  focused.value = true
  draft.value = props.value
  requestAnimationFrame(() => input.value?.select())
}

function commit() {
  if (draft.value !== props.value) emit('commit', draft.value)
}

function onBlur() {
  if (focused.value) commit()
  focused.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    draft.value = props.value
    focused.value = false
    input.value?.blur()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    commit()
    focused.value = false
    emit('enter')
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    emit('move', e.key === 'ArrowUp' ? -1 : 1)
  } else if (e.key === 'Tab' && props.col === 'description') {
    e.preventDefault()
    commit()
    emit('tab', e.shiftKey)
  }
}

function onPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text/plain') ?? ''
  if (/[\t\n]/.test(text.trim())) {
    e.preventDefault()
    emit('paste', text)
  }
}
</script>

<template>
  <FormInput
    :model-value="shown"
    size="xs"
    variant="cell"
    class="min-w-0 flex-1"
    :readonly="readonly"
    :placeholder="placeholder"
    :title="title"
    :data-row="rowId"
    :data-col="col"
    :aria-label="columnLabels[col] ?? col"
    :input-class="[
      readonly ? 'cursor-default' : '',
      align === 'right' ? 'text-right tabular-nums' : align === 'center' ? 'text-center' : 'text-left',
      inputClass,
    ].join(' ')"
    @focus="onFocus"
    @blur="onBlur"
    @update:model-value="(value) => draft = String(value ?? '')"
    @keydown="onKeydown"
    @paste="onPaste"
  />
</template>
