<script lang="ts">
import { shallowRef as sharedRef } from 'vue'
/** Cierre del menú abierto actualmente (compartido entre instancias). */
const openDropdownClose = sharedRef<(() => void) | null>(null)
</script>

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

const props = defineProps<Props>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref<{ top: string; left: string }>({ top: '0', left: '0' })

const updatePanelPosition = () => {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const panelHeight = panelRef.value?.offsetHeight ?? props.items.length * 40 + 8
  // Si no cabe debajo (filas al final de la pantalla), se abre hacia arriba.
  const top =
    rect.bottom + 4 + panelHeight > window.innerHeight && rect.top - 4 - panelHeight > 0
      ? rect.top - 4 - panelHeight
      : rect.bottom + 4
  panelStyle.value = {
    top: `${top}px`,
    left: `${Math.max(8, rect.right - 160)}px`,
  }
}

const toggle = () => {
  // Solo un menú abierto a la vez: el clic en otro disparador no llega al documento.
  if (!isOpen.value && openDropdownClose.value && openDropdownClose.value !== close)
    openDropdownClose.value()
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

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOpen.value) close()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', updatePanelPosition, true)
  window.addEventListener('resize', updatePanelPosition)
})
onUnmounted(() => {
  if (openDropdownClose.value === close) openDropdownClose.value = null
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', updatePanelPosition, true)
  window.removeEventListener('resize', updatePanelPosition)
})
watch(isOpen, (open) => {
  if (open) {
    openDropdownClose.value = close
    nextTick(updatePanelPosition)
  } else if (openDropdownClose.value === close) {
    openDropdownClose.value = null
  }
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
        ref="panelRef"
        role="menu"
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
          role="menuitem"
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
