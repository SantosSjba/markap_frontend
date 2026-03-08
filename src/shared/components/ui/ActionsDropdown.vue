<script setup lang="ts">
/**
 * ActionsDropdown - Menú de acciones (ellipsis) reutilizable.
 * El panel se renderiza con Teleport en body para quedar siempre encima y no recortarse.
 */
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'

export interface ActionItem {
  label: string
  onClick: () => void
  /** Nombre de ícono Iconify, e.g. "lucide:pencil" */
  icon?: string
  /** Variante de color para acciones destructivas */
  danger?: boolean
}

interface Props {
  items: ActionItem[]
}

defineProps<Props>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelStyle = ref<{ top: string; left: string }>({ top: '0', left: '0' })

const updatePanelPosition = () => {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  panelStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${Math.max(8, rect.right - 160)}px`,
  }
}

const toggle = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(updatePanelPosition)
  }
}

const close = () => {
  isOpen.value = false
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.closest('.actions-dropdown') || target.closest('.actions-dropdown-panel')) return
  close()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', updatePanelPosition, true)
  window.addEventListener('resize', updatePanelPosition)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', updatePanelPosition, true)
  window.removeEventListener('resize', updatePanelPosition)
})
watch(isOpen, (open) => {
  if (open) nextTick(updatePanelPosition)
})
</script>

<template>
  <div class="actions-dropdown relative inline-block">
    <!-- Trigger: tres puntos verticales -->
    <button
      ref="triggerRef"
      type="button"
      class="p-2 rounded-lg transition-colors hover:bg-[var(--color-hover)]"
      :style="{ color: 'var(--color-text-muted)' }"
      aria-label="Acciones"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      @click.stop="toggle"
    >
      <slot name="trigger">
        <Icon icon="lucide:ellipsis-vertical" class="w-5 h-5" />
      </slot>
    </button>

    <!-- Panel de acciones -->
    <Teleport to="body">
      <div
        v-show="isOpen"
        class="actions-dropdown-panel fixed z-[9999] py-1 min-w-[160px] rounded-xl shadow-xl border"
        :style="{
          top: panelStyle.top,
          left: panelStyle.left,
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1))',
        }"
      >
        <button
          v-for="(item, idx) in items"
          :key="idx"
          type="button"
          class="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 transition-colors first:rounded-t-xl last:rounded-b-xl"
          :class="item.danger ? 'hover:bg-red-50 dark:hover:bg-red-950' : 'hover:bg-[var(--color-hover)]'"
          :style="{ color: item.danger ? 'var(--color-error, #dc2626)' : 'var(--color-text-primary)' }"
          @click.stop="item.onClick(); close()"
        >
          <Icon
            v-if="item.icon"
            :icon="item.icon"
            class="w-4 h-4 shrink-0 opacity-70"
          />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>
