<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, FormSectionCard } from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { FormSelect } from '@shared/components'

export type OwnerOption = { value: string; label: string }

const props = defineProps<{
  ownerIds: string[]
  ownerOptions: OwnerOption[]
  error?: string
  returnTo: string
}>()

const emit = defineEmits<{
  'update:ownerIds': [value: string[]]
}>()

const router = useRouter()

const rows = computed(() => (props.ownerIds.length > 0 ? props.ownerIds : ['']))

function optionsForIndex(index: number) {
  const selectedElsewhere = new Set(props.ownerIds.filter((id, i) => i !== index && id))
  return props.ownerOptions.filter((o) => !selectedElsewhere.has(o.value))
}

function updateAt(index: number, value: string) {
  const next = [...rows.value]
  next[index] = value
  emit('update:ownerIds', next)
}

function addOwner() {
  emit('update:ownerIds', [...rows.value, ''])
}

function removeAt(index: number) {
  if (rows.value.length <= 1) return
  emit(
    'update:ownerIds',
    rows.value.filter((_, i) => i !== index),
  )
}

function goToNewOwner(index: number) {
  router.push({
    name: 'alquileres-clientes-nuevo',
    query: {
      clientType: 'OWNER',
      returnTo: props.returnTo,
      selectedClientId: '',
      ownerIndex: String(index),
    },
  })
}
</script>

<template>
  <FormSectionCard
    title="Propietarios"
    subtitle="Puede registrar varios copropietarios (cónyuges, herederos, etc.). El primero es el propietario principal."
    icon="lucide:user-check"
  >
    <div class="space-y-3">
      <div
        v-for="(ownerId, index) in rows"
        :key="index"
        class="flex flex-wrap items-end gap-3 p-4 rounded-lg"
        :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
      >
        <div class="flex-1 min-w-[200px]">
          <FormSelect
            :model-value="ownerId"
            :label="index === 0 ? 'Propietario principal' : `Propietario ${index + 1}`"
            placeholder="Seleccionar propietario"
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
          :aria-label="`Quitar propietario ${index + 1}`"
          @click="removeAt(index)"
        >
          <AppIcon icon="lucide:trash-2" :size="18" color="var(--color-error)" />
        </BaseButton>
        <BaseButton
          type="button"
          variant="outline"
          class="flex items-center gap-2 shrink-0"
          @click="goToNewOwner(index)"
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
      @click="addOwner"
    >
      <AppIcon icon="lucide:plus" :size="18" color="currentColor" />
      Agregar propietario
    </BaseButton>

    <p
      v-if="ownerOptions.length === 0"
      class="text-sm mt-3 flex items-center gap-2"
      :style="{ color: 'var(--color-text-muted)' }"
    >
      <AppIcon icon="lucide:info" :size="14" />
      No hay propietarios registrados. Registra un cliente tipo «Propietario» desde Clientes.
    </p>
  </FormSectionCard>
</template>
