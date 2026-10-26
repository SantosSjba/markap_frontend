<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@shared/presentation/ui/collapsible'
import { SidebarMenuItem as UiSidebarMenuItem } from '@shared/presentation/ui/sidebar'
import { ChevronDownIcon } from '@shared/presentation/icons/layout'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { cn } from '@shared/presentation/utils/cn'
import SidebarSubmenuItem from './SidebarSubmenuItem.vue'
import type { NavItem } from './types'

interface SidebarMenuItemProps {
  nav: NavItem
  isOpen: boolean
  showContent: boolean
}

const props = defineProps<SidebarMenuItemProps>()

const emit = defineEmits<{ (e: 'toggle'): void }>()

const hasSubItems = computed(() => Boolean(props.nav.subItems?.length))
const isItemActive = computed(() =>
  hasSubItems.value ? props.isOpen || props.nav.active : props.nav.active,
)
const isPanelOpen = computed(() => props.showContent && props.isOpen)
</script>

<template>
  <UiSidebarMenuItem>
    <Collapsible v-if="hasSubItems" :open="isPanelOpen" @update:open="emit('toggle')">
      <CollapsibleTrigger
        :class="
          cn(
            'group menu-item cursor-pointer',
            isItemActive ? 'menu-item-active' : 'menu-item-inactive',
            !showContent ? 'xl:justify-center' : 'xl:justify-start',
          )
        "
      >
        <span :class="cn(isItemActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive')">
          <AppIcon :icon="nav.icon" :size="24" color="currentColor" class="size-6" />
        </span>
        <span v-if="showContent" class="menu-item-text truncate">{{ nav.name }}</span>
        <span
          v-if="nav.new && showContent"
          :class="
            cn(
              'menu-dropdown-badge absolute end-10 ms-auto',
              isItemActive ? 'menu-dropdown-badge-active' : 'menu-dropdown-badge-inactive',
            )
          "
        >
          nuevo
        </span>
        <ChevronDownIcon
          v-if="showContent"
          :class="
            cn(
              'ms-auto h-5 w-5 shrink-0 transition-transform duration-200',
              isOpen ? 'rotate-180 text-brand-500' : '',
            )
          "
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul class="ms-9 mt-2 space-y-1">
          <SidebarSubmenuItem
            v-for="subItem in nav.subItems"
            :key="subItem.path + subItem.name"
            :sub-item="subItem"
            :is-active="subItem.active"
          />
        </ul>
      </CollapsibleContent>
    </Collapsible>
    <RouterLink
      v-else-if="nav.path"
      :to="nav.path"
      :target="nav.target"
      :class="
        cn(
          'group menu-item',
          isItemActive ? 'menu-item-active' : 'menu-item-inactive',
          !showContent ? 'xl:justify-center' : 'xl:justify-start',
        )
      "
    >
      <span :class="cn(isItemActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive')">
        <AppIcon :icon="nav.icon" :size="24" color="currentColor" class="size-6" />
      </span>
      <span v-if="showContent" class="menu-item-text truncate">{{ nav.name }}</span>
    </RouterLink>
  </UiSidebarMenuItem>
</template>
