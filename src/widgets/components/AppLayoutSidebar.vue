<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { MenuItem } from '@shared/types'

/**
 * AppLayoutSidebar
 * Sidebar reutilizable para aplicaciones (Alquileres, Ventas, etc.)
 * Recibe menús dinámicos desde la BD como props
 */

interface ApplicationInfo {
  name: string
  slug: string
  icon?: string | null
  color?: string | null
}

interface Props {
  menus: MenuItem[]
  application: ApplicationInfo
  backUrl?: string
  isCollapsed?: boolean
  isMobileOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  backUrl: '/applications',
  isCollapsed: false,
  isMobileOpen: false,
})

const emit = defineEmits<{
  closeMobile: []
}>()

const route = useRoute()
const expandedIds = ref<Set<string>>(new Set())

// Base path de la aplicación (ej: /alquileres)
const basePath = computed(() => `/${props.application.slug}`)

// Convierte path del menú a ruta completa
// parentFullPath: cuando es un hijo, el path del hijo es relativo al padre
// Si el path ya está bajo la base de la app (ej: /alquileres/clientes), se usa tal cual
const toFullPath = (path: string | null, parentFullPath?: string): string => {
  if (!path || path === '#') return '#'
  const base = parentFullPath ?? basePath.value
  if (path === '/' || path === '') return base
  const pathNorm = path.startsWith('/') ? path : `/${path}`
  // Path ya es absoluto dentro de esta aplicación → no concatenar al padre
  if (pathNorm === basePath.value || pathNorm.startsWith(basePath.value + '/')) {
    return pathNorm.replace(/\/$/, '') || pathNorm
  }
  const segment = path.startsWith('/') ? path.slice(1) : path
  const parentBase = base.replace(/\/$/, '')
  return parentBase ? `${parentBase}/${segment}` : `/${segment}`
}

const isActive = (path: string | null, parentFullPath?: string) => {
  if (!path) return false
  const full = toFullPath(path, parentFullPath)
  if (full === '#') return false
  // El Dashboard (path "/") solo coincide exactamente con la ruta base, no con subrutas
  if (path === '/' || path === '') {
    return route.path === full || route.path === full + '/'
  }
  return route.path === full || route.path === full + '/' || route.path.startsWith(full + '/')
}

/** Entre varios hijos del mismo padre, devuelve el id del hijo que debe verse activo (el de ruta más específica que coincida) */
const getActiveChildId = (item: MenuItem): string | null => {
  if (!item.children?.length) return null
  const parentFull = toFullPath(item.path)
  const candidates = item.children
    .filter((c) => c.path)
    .map((c) => ({ id: c.id, full: toFullPath(c.path, parentFull) }))
    .filter((x) => x.full !== '#')
  // Ordenar por longitud de path descendente para que /alquileres/clientes/nuevo gane sobre /alquileres/clientes
  candidates.sort((a, b) => b.full.length - a.full.length)
  const active = candidates.find(
    (x) =>
      route.path === x.full ||
      route.path === x.full + '/' ||
      route.path.startsWith(x.full + '/')
  )
  return active?.id ?? null
}

const isActiveChild = (child: MenuItem, parent: MenuItem): boolean => {
  const activeId = getActiveChildId(parent)
  return activeId === child.id
}

const hasActiveChild = (item: MenuItem): boolean => {
  if (item.children?.length) {
    return getActiveChildId(item) !== null
  }
  return false
}

const toggleExpand = (id: string) => {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
  expandedIds.value = new Set(expandedIds.value)
}

const isExpanded = (id: string) => expandedIds.value.has(id)

// Normaliza nombre de ícono (PascalCase/camelCase -> kebab-case)
const normalizeIconName = (name: string | null) =>
  name
    ? name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
    : null

// Iconos por nombre (SVG paths)
const iconMap: Record<string, string> = {
  'layout-dashboard':
    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  building:
    'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  'file-text':
    'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  users:
    'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  'dollar-sign':
    'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'bar-chart':
    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  settings:
    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  key: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  'user-plus':
    'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
}

const getIconPath = (iconName: string | null) => {
  const key = normalizeIconName(iconName)
  return key ? iconMap[key] || iconMap['layout-dashboard'] : null
}

// Expandir padres que tengan un hijo activo
const expandActiveParents = () => {
  props.menus.forEach((item) => {
    if (item.children?.length && hasActiveChild(item)) {
      expandedIds.value.add(item.id)
    }
  })
  expandedIds.value = new Set(expandedIds.value)
}

onMounted(expandActiveParents)
watch(() => route.path, expandActiveParents)
watch(() => props.menus, expandActiveParents, { deep: true })

const appColor = computed(
  () => props.application.color || 'var(--color-primary)'
)

const sidebarClasses = computed(() => [
  'fixed top-0 left-0 h-full z-40 overflow-y-auto',
  'transition-all duration-300 ease-in-out',
  props.isCollapsed ? 'w-20' : 'w-64',
  props.isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
])
</script>

<template>
  <aside
    :class="sidebarClasses"
    class="bg-[var(--color-surface)] border-r flex flex-col"
    :style="{ borderColor: 'var(--color-border)' }"
  >
    <!-- App Header -->
    <div class="p-4 border-b shrink-0" :style="{ borderColor: 'var(--color-border)' }">
      <div v-if="!isCollapsed" class="space-y-1">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            :style="{ backgroundColor: appColor + '20', color: appColor }"
          >
            <svg
              v-if="application.icon"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                :d="getIconPath(application.icon) || ''"
              />
            </svg>
            <span v-else class="text-lg font-bold">
              {{ application.name?.charAt(0) || 'A' }}
            </span>
          </div>
          <div class="min-w-0">
            <h2 class="font-bold truncate" style="color: var(--color-text-primary)">
              {{ application.name }}
            </h2>
            <p class="text-xs truncate" style="color: var(--color-text-muted)">
              MARKAPP
            </p>
          </div>
        </div>
        <router-link
          :to="backUrl"
          class="flex items-center gap-2 text-sm hover-surface rounded-lg px-2 py-2 -mx-2"
          style="color: var(--color-text-secondary)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a Aplicaciones
        </router-link>
      </div>
      <div v-else class="flex justify-center">
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center"
          :style="{ backgroundColor: appColor + '20', color: appColor }"
        >
          <svg
            v-if="application.icon"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              :d="getIconPath(application.icon) || ''"
            />
          </svg>
          <span v-else class="text-lg font-bold">
            {{ application.name?.charAt(0) || 'A' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Menu -->
    <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
      <template v-for="item in menus" :key="item.id">
        <!-- Item con submenús -->
        <div v-if="item.children?.length">
          <button
            type="button"
            :class="[
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left',
              hasActiveChild(item)
                ? 'font-medium'
                : '',
            ]"
            :style="{
              color: hasActiveChild(item) ? appColor : 'var(--color-text-primary)',
              backgroundColor: hasActiveChild(item) ? appColor + '15' : 'transparent',
            }"
            @click="toggleExpand(item.id)"
          >
            <div
              v-if="item.icon"
              class="w-5 h-5 flex-shrink-0 flex items-center justify-center"
              :style="{ color: hasActiveChild(item) ? appColor : 'var(--color-text-muted)' }"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  :d="getIconPath(item.icon) || ''"
                />
              </svg>
            </div>
            <span v-if="!isCollapsed" class="flex-1 truncate">{{ item.label }}</span>
            <svg
              v-if="!isCollapsed"
              class="w-4 h-4 flex-shrink-0 transition-transform"
              :class="{ 'rotate-180': isExpanded(item.id) }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <Transition
            enter-active-class="transition-all duration-200"
            leave-active-class="transition-all duration-150"
            enter-from-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-96"
            leave-from-class="opacity-100 max-h-96"
            leave-to-class="opacity-0 max-h-0"
          >
            <div
              v-if="isExpanded(item.id) || hasActiveChild(item)"
              v-show="!isCollapsed"
              class="ml-4 pl-4 border-l space-y-1 mt-1"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <router-link
                v-for="child in item.children"
                :key="child.id"
                :to="toFullPath(child.path, toFullPath(item.path))"
                class="flex items-center px-3 py-2 rounded-lg hover-surface text-sm transition-colors"
                :class="[
                  isActiveChild(child, item) ? 'font-medium' : '',
                ]"
                :style="{
                  color: isActiveChild(child, item) ? appColor : 'var(--color-text-secondary)',
                  backgroundColor: isActiveChild(child, item) ? appColor + '12' : 'transparent',
                }"
                @click="emit('closeMobile')"
              >
                {{ child.label }}
              </router-link>
            </div>
          </Transition>
        </div>

        <!-- Item sin submenús -->
        <router-link
          v-else
          :key="item.id"
          :to="toFullPath(item.path)"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
            isActive(item.path || '') ? 'font-medium' : '',
            isCollapsed && 'justify-center',
          ]"
          :style="{
            color: isActive(item.path || '') ? appColor : 'var(--color-text-primary)',
            backgroundColor: isActive(item.path || '') ? appColor + '15' : 'transparent',
          }"
          @click="emit('closeMobile')"
        >
          <div
            v-if="item.icon"
            class="w-5 h-5 flex-shrink-0 flex items-center justify-center"
            :style="{ color: isActive(item.path || '') ? appColor : 'var(--color-text-muted)' }"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                :d="getIconPath(item.icon) || ''"
              />
            </svg>
          </div>
          <span v-if="!isCollapsed" class="truncate">{{ item.label }}</span>
        </router-link>
      </template>
    </nav>

    <!-- Footer -->
    <div
      class="p-4 border-t shrink-0"
      :style="{ borderColor: 'var(--color-border)' }"
    >
      <p
        v-if="!isCollapsed"
        class="text-xs text-center"
        style="color: var(--color-text-muted)"
      >
        MARKAP S.A.C. v1.0
      </p>
    </div>
  </aside>
</template>
