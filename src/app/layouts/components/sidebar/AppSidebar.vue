<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { MenuItem } from '@shared/domain/menu.types'
import { Sidebar, SidebarContent, useSidebar } from '@shared/presentation/ui/sidebar'
import { buildNavItems } from './menu-matching'
import AppSidebarHeader from './SidebarHeader.vue'
import SidebarNavGroup from './SidebarNavGroup.vue'
import type { ApplicationInfo, MenuSection, MenuType } from './types'

interface AppSidebarProps {
  menus: MenuItem[]
  application: ApplicationInfo
  backUrl?: string
  backLabel?: string
}

const props = withDefaults(defineProps<AppSidebarProps>(), {
  backUrl: '/applications',
  backLabel: 'Volver a Aplicaciones',
})

const route = useRoute()
const { open, isMobile, isHovered } = useSidebar()

const pathname = computed(() => route.path)

const showContent = computed(() => open.value || isHovered.value || isMobile.value)

const basePath = computed(() => `/${props.application.slug}`)

const menuSections = computed<MenuSection[]>(() => [
  {
    type: 'main',
    label: 'Menú',
    items: buildNavItems(basePath.value, props.menus, pathname.value),
  },
  {
    type: 'others',
    label: 'General',
    items: [{ name: props.backLabel, icon: 'lucide:arrow-left', path: props.backUrl, active: false }],
  },
])

const findMatchingSubmenu = () => {
  for (const section of menuSections.value) {
    const index = section.items.findIndex((nav) => nav.active && nav.subItems?.length)
    if (index !== -1) return { type: section.type, index }
  }
  return null
}

const openSubmenu = ref<{ type: MenuType; index: number } | null>(findMatchingSubmenu())

// Al navegar (o al terminar de cargar los menús) se abre el grupo del ítem activo.
watch([pathname, () => props.menus], () => {
  openSubmenu.value = findMatchingSubmenu()
})

const handleSubmenuToggle = (index: number, menuType: MenuType) => {
  const prevOpenSubmenu = openSubmenu.value
  if (prevOpenSubmenu && prevOpenSubmenu.type === menuType && prevOpenSubmenu.index === index) {
    openSubmenu.value = null
    return
  }
  openSubmenu.value = { type: menuType, index }
}
</script>

<template>
  <Sidebar side="left" collapsible="icon">
    <AppSidebarHeader
      :show-content="showContent"
      :application="application"
      :home-url="basePath"
    />

    <SidebarContent class="overflow-y-auto px-5 duration-300 ease-linear">
      <nav class="mb-6">
        <div class="flex flex-col gap-4">
          <SidebarNavGroup
            v-for="section in menuSections"
            :key="section.type"
            :label="section.label"
            :menu-type="section.type"
            :items="section.items"
            :open-submenu="openSubmenu"
            :show-content="showContent"
            @toggle-submenu="handleSubmenuToggle"
          />
        </div>
      </nav>
    </SidebarContent>
  </Sidebar>
</template>
