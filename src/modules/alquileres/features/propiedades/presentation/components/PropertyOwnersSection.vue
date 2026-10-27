<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { fieldLabelClass } from '@shared/presentation/components/forms/field-classes'
import ClienteFormModal from '../../../clientes/presentation/components/ClienteFormModal.vue'
/**
 * PropertyOwnersSection — propietario principal + copropietarios. «Nuevo» abre el alta
 * de propietario en un modal y lo deja seleccionado en esa fila, sin salir del formulario.
 * El modal por defecto registra en Alquileres; el slot `new-owner-modal` lo reemplaza.
 */
export type OwnerOption = { value: string; label: string }

const props = defineProps<{
  ownerIds: string[]
  ownerOptions: OwnerOption[]
  error?: string
}>()

const emit = defineEmits<{
  'update:ownerIds': [value: string[]]
}>()

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

const modalOpen = ref(false)
const targetIndex = ref(0)

function openNewOwner(index: number) {
  targetIndex.value = index
  modalOpen.value = true
}

function onOwnerCreated(client: { id: string }) {
  updateAt(targetIndex.value, client.id)
}
</script>

<template>
  <FormSectionCard
    title="Propietarios"
    subtitle="El primero es el propietario principal; agrega copropietarios si los hay."
  >
    <div class="space-y-4">
      <div v-for="(ownerId, index) in rows" :key="index">
        <label :class="fieldLabelClass">
          {{ index === 0 ? 'Propietario principal' : `Copropietario ${index}` }}
          <span class="text-error-500">*</span>
        </label>
        <!-- items-start: los botones quedan a la altura del select aunque aparezca el error debajo -->
        <div class="mt-2 flex items-start gap-2">
          <FormSelect
            class="min-w-0 flex-1"
            :model-value="ownerId"
            placeholder="Seleccionar propietario"
            :options="optionsForIndex(index)"
            :error="index === 0 ? error : undefined"
            :aria-label="index === 0 ? 'Propietario principal' : `Copropietario ${index}`"
            @update:model-value="updateAt(index, $event)"
          />
          <BaseButton
            type="button"
            variant="outline"
            size="lg"
            icon="lucide:user-plus"
            class="shrink-0"
            @click="openNewOwner(index)"
          >
            Nuevo
          </BaseButton>
          <BaseButton
            v-if="rows.length > 1"
            type="button"
            variant="outline"
            size="lg"
            icon="lucide:trash-2"
            class="shrink-0 px-3! text-error-500"
            :aria-label="`Quitar copropietario ${index}`"
            @click="removeAt(index)"
          />
        </div>
      </div>
    </div>

    <BaseButton type="button" variant="ghost" size="sm" icon="lucide:plus" class="mt-4" @click="addOwner">
      Agregar copropietario
    </BaseButton>

    <!-- Otra aplicación (ej. Ventas) pone aquí su propio modal de alta de propietario -->
    <slot
      name="new-owner-modal"
      :open="modalOpen"
      :set-open="(value: boolean) => (modalOpen = value)"
      :on-created="onOwnerCreated"
    >
      <ClienteFormModal v-model:open="modalOpen" client-type="OWNER" @created="onOwnerCreated" />
    </slot>
  </FormSectionCard>
</template>
