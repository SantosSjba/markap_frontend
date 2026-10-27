<script setup lang="ts">
import Avatar from '@shared/presentation/components/ui/Avatar.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
/** SaleParticipantList — compradores o propietarios de un proceso, con documento y contacto. */

export interface SaleParticipantItem {
  id: string
  fullName: string
  documentNumber?: string | null
  documentTypeName?: string | null
  primaryPhone?: string | null
  primaryEmail?: string | null
  isPrimary?: boolean
}

withDefaults(
  defineProps<{
    people: SaleParticipantItem[]
    /** Etiqueta del participante principal (ej. «Titular», «Principal») */
    primaryLabel?: string
    emptyText: string
  }>(),
  { primaryLabel: 'Principal' },
)
</script>

<template>
  <ul v-if="people.length" class="divide-y divide-gray-100 dark:divide-gray-800">
    <li v-for="p in people" :key="p.id" class="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <Avatar :name="p.fullName" size="md" />
      <div class="min-w-0 flex-1">
        <p class="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-800 dark:text-white/90">
          {{ p.fullName }}
          <Badge v-if="p.isPrimary" variant="info">{{ primaryLabel }}</Badge>
        </p>
        <p v-if="p.documentNumber" class="mt-0.5 flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
          <AppIcon icon="lucide:id-card" :size="13" />
          {{ p.documentTypeName ? `${p.documentTypeName} ` : '' }}{{ p.documentNumber }}
        </p>
        <div v-if="p.primaryPhone || p.primaryEmail" class="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
          <a v-if="p.primaryPhone" :href="`tel:${p.primaryPhone}`" class="flex items-center gap-1.5 hover:text-brand-500">
            <AppIcon icon="lucide:phone" :size="13" />{{ p.primaryPhone }}
          </a>
          <a v-if="p.primaryEmail" :href="`mailto:${p.primaryEmail}`" class="flex min-w-0 items-center gap-1.5 truncate hover:text-brand-500">
            <AppIcon icon="lucide:mail" :size="13" />{{ p.primaryEmail }}
          </a>
        </div>
      </div>
    </li>
  </ul>
  <p v-else class="text-sm text-gray-400 dark:text-gray-500">{{ emptyText }}</p>
</template>
