<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, FormSelect } from '@shared/components'
import { useContabilidadActiveLegalEntity } from '../composables/useContabilidadActiveLegalEntity'

const { entities, activeLegalEntityId, loading, setActiveLegalEntity } = useContabilidadActiveLegalEntity()

const options = computed(() =>
  (entities.value ?? []).map((e) => ({
    value: e.id,
    label: `${e.ruc} — ${e.legalName}`,
  })),
)

const selectedId = computed({
  get: () => activeLegalEntityId.value ?? '',
  set: (value: string | number | null) => {
    const entity = (entities.value ?? []).find((e) => e.id === value)
    if (entity) setActiveLegalEntity(entity)
  },
})

const activeEntity = computed(() =>
  (entities.value ?? []).find((e) => e.id === activeLegalEntityId.value),
)
</script>

<template>
  <div
    class="mb-3 rounded-xl border px-4 py-3 text-sm"
    :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
  >
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <div class="flex items-center gap-2 shrink-0" :style="{ color: 'var(--color-text-secondary)' }">
        <AppIcon icon="lucide:building-2" :size="16" color="var(--color-primary)" />
        <span class="font-medium">Empresa / RUC</span>
      </div>
      <div class="min-w-0 flex-1 sm:max-w-xl">
        <FormSelect
          v-model="selectedId"
          :options="options"
          :loading="loading"
          :disabled="loading || !options.length"
          placeholder="Seleccionar empresa…"
        />
      </div>
      <span v-if="activeEntity" class="text-xs font-mono shrink-0" :style="{ color: 'var(--color-text-muted)' }">
        {{ activeEntity.code }}
      </span>
    </div>
  </div>
</template>
