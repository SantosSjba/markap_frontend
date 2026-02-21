<script setup lang="ts">
/**
 * ActionsDropdown - Menú de acciones (ellipsis) reutilizable.
 * El panel se renderiza con Teleport en body para quedar siempre encima y no recortarse.
 */
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

export interface ActionItem {
  label: string
  onClick: () => void
  icon?: string
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
    left: `${Math.max(8, rect.right - 140)}px`,
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
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </slot>
    </button>
    <Teleport to="body">
      <div
        v-show="isOpen"
        class="actions-dropdown-panel fixed z-[9999] py-1 min-w-[140px] rounded-lg shadow-xl border"
        :style="{
          top: panelStyle.top,
          left: panelStyle.left,
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }"
      >
        <button
          v-for="(item, idx) in items"
          :key="idx"
          type="button"
          class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-[var(--color-hover)] transition-colors first:rounded-t-lg last:rounded-b-lg"
          :style="{ color: 'var(--color-text-primary)' }"
          @click.stop="item.onClick(); close()"
        >
          <slot name="item-icon" :item="item">
            <svg
              v-if="item.label.toLowerCase().includes('editar')"
              class="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </slot>
          {{ item.label }}
        </button>
      </div>
    </Teleport>
  </div>
</template>
