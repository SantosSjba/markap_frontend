<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton } from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { FormSelect } from '@shared/components'

export type TenantOption = { value: string; label: string }

const props = defineProps<{
  tenantIds: string[]
  tenantOptions: TenantOption[]
  error?: string
  returnTo: string
}>()

const emit = defineEmits<{
  'update:tenantIds': [value: string[]]
}>()

const router = useRouter()

const rows = computed(() =>
  props.tenantIds.length > 0 ? props.tenantIds : [''],
)

function optionsForIndex(index: number) {
  const selectedElsewhere = new Set(
    props.tenantIds.filter((id, i) => i !== index && id),
  )
  return props.tenantOptions.filter((o) => !selectedElsewhere.has(o.value))
}

function updateAt(index: number, value: string) {
  const next = [...rows.value]
  next[index] = value
  emit('update:tenantIds', next)
}

function addTenant() {
  emit('update:tenantIds', [...rows.value, ''])
}

function removeAt(index: number) {
  if (rows.value.length <= 1) return
  const next = rows.value.filter((_, i) => i !== index)
  emit('update:tenantIds', next)
}

function goToNewTenant(index: number) {
  router.push({
    name: 'alquileres-clientes-nuevo',
    query: {
      clientType: 'TENANT',
      returnTo: props.returnTo,
      selectedClientId: '',
      tenantIndex: String(index),
    },
  })
}
</script>

<template>
  <section
    class="p-5 rounded-xl"
    :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
  >
    <div class="flex items-center gap-2 mb-2">
      <AppIcon icon="lucide:users" :size="20" color="var(--color-primary)" />
      <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
        Inquilinos
      </h2>
    </div>
    <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
      Puede haber uno o más inquilinos en el mismo contrato. El primero será el contacto principal en cobranzas.
    </p>

    <div class="space-y-3">
      <div
        v-for="(tenantId, index) in rows"
        :key="index"
        class="flex flex-wrap items-end gap-3 p-4 rounded-lg"
        :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
      >
        <div class="flex-1 min-w-[200px]">
          <FormSelect
            :model-value="tenantId"
            :label="index === 0 ? 'Inquilino principal' : `Inquilino ${index + 1}`"
            placeholder="Seleccionar inquilino"
            :options="optionsForIndex(index)"
            :error="index === 0 ? error : undefined"
            required
            @update:model-value="updateAt(index, $event)"
          />
        </div>
        <BaseButton
          v-if="rows.length > 1"
          type="button"
          variant="outline"
          class="shrink-0"
          :aria-label="`Quitar inquilino ${index + 1}`"
          @click="removeAt(index)"
        >
          <AppIcon icon="lucide:trash-2" :size="18" color="var(--color-error)" />
        </BaseButton>
        <BaseButton
          type="button"
          variant="outline"
          class="flex items-center gap-2 shrink-0"
          @click="goToNewTenant(index)"
        >
          <AppIcon icon="lucide:user-plus" :size="18" color="currentColor" />
          Nuevo
        </BaseButton>
      </div>
    </div>

    <BaseButton
      type="button"
      variant="outline"
      class="mt-4 flex items-center gap-2"
      @click="addTenant"
    >
      <AppIcon icon="lucide:plus" :size="18" color="currentColor" />
      Agregar inquilino
    </BaseButton>
  </section>
</template>
