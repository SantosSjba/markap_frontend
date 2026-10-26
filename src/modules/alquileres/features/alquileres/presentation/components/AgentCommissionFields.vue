<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { fieldLabelClass } from '@shared/presentation/components/forms/field-classes'
import AgenteFormModal from '../../../agentes/presentation/components/AgenteFormModal.vue'
import type { AgentType } from '../../../agentes/domain/agent.types'
import type { FinancialValueType } from '../../domain/rental.types'
import FinancialAmountFields from './FinancialAmountFields.vue'
/**
 * AgentCommissionFields — agente (del catálogo o nombre manual) y su comisión.
 * «Nuevo» registra el agente en un modal y lo deja seleccionado.
 */

const props = defineProps<{
  agentType: AgentType
  agentOptions: { value: string; label: string }[]
  contractCurrency: string
  canWrite?: boolean
  valueError?: string
}>()

const agentId = defineModel<string>('agentId', { required: true })
const agentName = defineModel<string>('agentName', { required: true })
const type = defineModel<FinancialValueType>('type', { required: true })
const value = defineModel<number | string>('value', { required: true })
const currency = defineModel<string | null>('currency', { required: true })

const label = computed(() => (props.agentType === 'INTERNAL' ? 'Agente interno' : 'Agente externo'))
const options = computed(() => [{ value: '', label: 'Sin agente del catálogo' }, ...props.agentOptions])

const modalOpen = ref(false)
function onAgentCreated(agent: { id: string; fullName: string }) {
  agentId.value = agent.id
  agentName.value = agent.fullName
}
</script>

<template>
  <div class="space-y-3">
    <div>
      <label :class="fieldLabelClass">{{ label }}</label>
      <!-- items-start: el botón queda a la altura del select -->
      <div class="mt-2 flex items-start gap-2">
        <FormSelect
          v-model="agentId"
          class="min-w-0 flex-1"
          :options="options"
          placeholder="Sin agente del catálogo"
          :aria-label="label"
        />
        <BaseButton
          v-if="canWrite"
          type="button"
          variant="outline"
          size="lg"
          icon="lucide:user-plus"
          class="shrink-0"
          @click="modalOpen = true"
        >
          Nuevo
        </BaseButton>
      </div>
    </div>
    <FormInput
      v-if="!agentId"
      v-model="agentName"
      label="Nombre (si no está en el catálogo)"
      :placeholder="agentType === 'INTERNAL' ? 'Ej. María López' : 'Ej. Inmobiliaria Pérez'"
    />
    <FinancialAmountFields
      v-model:type="type"
      v-model:value="value"
      v-model:currency="currency"
      :contract-currency="contractCurrency"
      value-label="Comisión"
      :error="valueError"
    />

    <AgenteFormModal v-model:open="modalOpen" :agent-type="agentType" @created="onAgentCreated" />
  </div>
</template>
