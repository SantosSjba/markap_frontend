<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { MenuItem } from '@shared/domain'
import AppIcon from '@shared/components/ui/AppIcon.vue'

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

// Rutas de menú que redirigen a otra URL (solo navegación; no compiten por resaltado)
const MENU_ACTIVE_ALIASES: Record<string, string> = {
  '/contabilidad/libros-e/libro-diario': '/contabilidad/asientos/libro-diario',
}

function isLibrosElectronicosSection(parent: MenuItem): boolean {
  const parentFull = toFullPath(parent.path)
  return (
    parent.label?.toLowerCase().includes('libros electr') === true ||
    parentFull.includes('/libros-e') ||
    parent.id.toLowerCase().includes('lib')
  )
}

/** Enlace en Libros electrónicos que apunta al módulo de asientos (no debe resaltarse allí). */
function isLibrosCrossLink(menuFull: string, parent: MenuItem): boolean {
  if (!isLibrosElectronicosSection(parent)) return false
  const resolved = MENU_ACTIVE_ALIASES[menuFull] ?? menuFull
  return (
    resolved.startsWith('/contabilidad/asientos') ||
    menuFull.startsWith('/contabilidad/asientos')
  )
}

function scoreMenuMatch(menuFull: string, routePath: string, parent: MenuItem): number {
  if (menuFull === '#') return 0
  if (isLibrosCrossLink(menuFull, parent)) return 0

  const resolved = MENU_ACTIVE_ALIASES[menuFull] ?? menuFull
  const isAlias = menuFull !== resolved

  if (routePath === resolved || routePath === resolved + '/') {
    return 1000 + resolved.length - (isAlias ? 100 : 0)
  }
  if (routePath.startsWith(resolved + '/')) {
    return 500 + resolved.length
  }
  return 0
}

function menuPathMatchesRoute(menuFull: string, routePath: string, parent?: MenuItem): boolean {
  if (menuFull === '#') return false
  if (parent && isLibrosCrossLink(menuFull, parent)) return false
  const resolved = MENU_ACTIVE_ALIASES[menuFull] ?? menuFull
  return (
    routePath === resolved ||
    routePath === resolved + '/' ||
    routePath.startsWith(resolved + '/')
  )
}

/** Un solo ítem hijo activo en todo el sidebar (el de mayor especificidad). */
const activeMenuEntry = computed(() => {
  let best: { parentId: string; childId: string; score: number } | null = null

  for (const parent of props.menus) {
    if (!parent.children?.length) continue
    const parentFull = toFullPath(parent.path)

    for (const child of parent.children) {
      if (!child.path) continue
      const menuFull = toFullPath(child.path, parentFull)
      const score = scoreMenuMatch(menuFull, route.path, parent)
      if (score <= 0) continue
      if (!best || score > best.score) {
        best = { parentId: parent.id, childId: child.id, score }
      }
    }
  }
  return best
})

const isActive = (path: string | null, parentFullPath?: string) => {
  if (!path) return false
  const full = toFullPath(path, parentFullPath)
  if (full === '#') return false
  // El path raíz de la aplicación (ej: /alquileres) es el Dashboard:
  // solo coincide de forma exacta, nunca por prefijo.
  if (full === basePath.value || path === '/' || path === '') {
    return route.path === full || route.path === full + '/'
  }
  return menuPathMatchesRoute(full, route.path)
}

/** Entre varios hijos del mismo padre, devuelve el id del hijo activo global (si pertenece a este padre). */
const getActiveChildId = (item: MenuItem): string | null => {
  const active = activeMenuEntry.value
  if (!active || active.parentId !== item.id) return null
  return active.childId
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

/** Nombre desde BD (ej. layout-dashboard) → id Iconify */
const menuIconId = (iconName: string | null) => {
  const key = normalizeIconName(iconName) || 'layout-dashboard'
  if (key.includes(':')) return key
  return `lucide:${key}`
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
            <AppIcon
              v-if="application.icon"
              :icon="menuIconId(application.icon)"
              :size="20"
              color="currentColor"
            />
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
          <AppIcon icon="lucide:arrow-left" :size="16" color="currentColor" />
          Volver a Aplicaciones
        </router-link>
      </div>
      <div v-else class="flex justify-center">
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center"
          :style="{ backgroundColor: appColor + '20', color: appColor }"
        >
          <AppIcon
            v-if="application.icon"
            :icon="menuIconId(application.icon)"
            :size="20"
            color="currentColor"
          />
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
              <AppIcon
                :icon="menuIconId(item.icon)"
                :size="20"
                color="currentColor"
              />
            </div>
            <span v-if="!isCollapsed" class="flex-1 truncate">{{ item.label }}</span>
            <AppIcon
              v-if="!isCollapsed"
              icon="lucide:chevron-down"
              :size="16"
              color="currentColor"
              class="flex-shrink-0"
              :rotate="isExpanded(item.id) ? 180 : 0"
            />
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
            <AppIcon
              :icon="menuIconId(item.icon)"
              :size="20"
              color="currentColor"
            />
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
