<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormCombobox from '@shared/presentation/components/forms/FormCombobox.vue'
import { fieldLabelClass } from '@shared/presentation/components/forms/field-classes'
import ClienteFormModal from '../../../clientes/presentation/components/ClienteFormModal.vue'
/**
 * PropertyOwnersSection — propietario principal + copropietarios. «Nuevo» abre el alta
 * de propietario en un modal y lo deja seleccionado en esa fila, sin salir del formulario.
 * El modal por defecto registra en Alquileres; el slot `new-owner-modal` lo reemplaza.
 * Los textos son configurables para reutilizarla con otros participantes (ej. compradores en Ventas)
 * y `searchable` cambia el select por uno con búsqueda para listas largas.
 */
export type OwnerOption = { value: string; label: string; description?: string }

const props = withDefaults(
  defineProps<{
    ownerIds: string[]
    ownerOptions: OwnerOption[]
    error?: string
    title?: string
    subtitle?: string
    /** Etiqueta del primero (ej. «Propietario principal») */
    primaryLabel?: string
    /** Prefijo de los demás, seguido del número (ej. «Copropietario») */
    secondaryLabel?: string
    addLabel?: string
    placeholder?: string
    searchable?: boolean
  }>(),
  {
    error: undefined,
    title: 'Propietarios',
    subtitle: 'El primero es el propietario principal; agrega copropietarios si los hay.',
    primaryLabel: 'Propietario principal',
    secondaryLabel: 'Copropietario',
    addLabel: 'Agregar copropietario',
    placeholder: 'Seleccionar propietario',
    searchable: false,
  },
)

const rowLabel = (index: number) =>
  index === 0 ? props.primaryLabel : `${props.secondaryLabel} ${index}`

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
  <FormSectionCard :title="title" :subtitle="subtitle">
    <div class="space-y-4">
      <div v-for="(ownerId, index) in rows" :key="index">
        <label :class="fieldLabelClass">
          {{ rowLabel(index) }}
          <span class="text-error-500">*</span>
        </label>
        <!-- items-start: los botones quedan a la altura del select aunque aparezca el error debajo -->
        <div class="mt-2 flex items-start gap-2">
          <component
            :is="searchable ? FormCombobox : FormSelect"
            class="min-w-0 flex-1"
            :model-value="ownerId"
            :placeholder="placeholder"
            :options="optionsForIndex(index)"
            :error="index === 0 ? error : undefined"
            :aria-label="rowLabel(index)"
            @update:model-value="updateAt(index, $event ?? '')"
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
            :aria-label="`Quitar ${rowLabel(index).toLowerCase()}`"
            @click="removeAt(index)"
          />
        </div>
      </div>
    </div>

    <BaseButton type="button" variant="ghost" size="sm" icon="lucide:plus" class="mt-4" @click="addOwner">
      {{ addLabel }}
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
