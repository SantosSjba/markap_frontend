<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { fieldLabelClass } from '@shared/presentation/components/forms/field-classes'
import ClienteFormModal from '../../../clientes/presentation/components/ClienteFormModal.vue'
/**
 * RentalTenantsSection — inquilino principal + co-inquilinos. «Nuevo» abre el alta de
 * inquilino en un modal y lo deja seleccionado en esa fila, sin salir del formulario.
 */
export type TenantOption = { value: string; label: string }

const props = defineProps<{
  tenantIds: string[]
  tenantOptions: TenantOption[]
  error?: string
}>()

const emit = defineEmits<{
  'update:tenantIds': [value: string[]]
}>()

const rows = computed(() => (props.tenantIds.length > 0 ? props.tenantIds : ['']))

function optionsForIndex(index: number) {
  const selectedElsewhere = new Set(props.tenantIds.filter((id, i) => i !== index && id))
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
  emit(
    'update:tenantIds',
    rows.value.filter((_, i) => i !== index),
  )
}

const modalOpen = ref(false)
const targetIndex = ref(0)

function openNewTenant(index: number) {
  targetIndex.value = index
  modalOpen.value = true
}

function onTenantCreated(client: { id: string }) {
  updateAt(targetIndex.value, client.id)
}
</script>

<template>
  <FormSectionCard
    title="Inquilinos"
    subtitle="El primero es el inquilino principal; agrega co-inquilinos si los hay."
  >
    <div class="space-y-4">
      <div v-for="(tenantId, index) in rows" :key="index">
        <label :class="fieldLabelClass">
          {{ index === 0 ? 'Inquilino principal' : `Co-inquilino ${index}` }}
          <span class="text-error-500">*</span>
        </label>
        <!-- items-start: los botones quedan a la altura del select aunque aparezca el error debajo -->
        <div class="mt-2 flex items-start gap-2">
          <FormSelect
            class="min-w-0 flex-1"
            :model-value="tenantId"
            placeholder="Seleccionar inquilino"
            :options="optionsForIndex(index)"
            :error="index === 0 ? error : undefined"
            :aria-label="index === 0 ? 'Inquilino principal' : `Co-inquilino ${index}`"
            @update:model-value="updateAt(index, $event)"
          />
          <BaseButton
            type="button"
            variant="outline"
            size="lg"
            icon="lucide:user-plus"
            class="shrink-0"
            @click="openNewTenant(index)"
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
            :aria-label="`Quitar co-inquilino ${index}`"
            @click="removeAt(index)"
          />
        </div>
      </div>
    </div>

    <BaseButton type="button" variant="ghost" size="sm" icon="lucide:plus" class="mt-4" @click="addTenant">
      Agregar co-inquilino
    </BaseButton>

    <ClienteFormModal v-model:open="modalOpen" client-type="TENANT" @created="onTenantCreated" />
  </FormSectionCard>
</template>
