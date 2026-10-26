<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { useContabilidadActiveLegalEntity } from '../../../../presentation/composables/useContabilidadActiveLegalEntity'
import {
  useContabilidadCpeProviderConfig,
  useContabilidadSaveCpeProviderConfig,
} from '../composables/useContabilidadCpe'
import { CPE_PROVIDER_OPTIONS } from '../../domain/cpe.types'
const { activeLegalEntityId, entities } = useContabilidadActiveLegalEntity()
const activeEntity = computed(() => entities.value?.find((e) => e.id === activeLegalEntityId.value))

const { data, isLoading, refetch } = useContabilidadCpeProviderConfig()
const { mutate: saveConfig, isPending: saving } = useContabilidadSaveCpeProviderConfig()

const form = ref({
  providerCode: 'MOCK',
  apiBaseUrl: '',
  apiToken: '',
  certificateHint: '',
  useSandbox: true,
  isActive: true,
})

watch(
  () => data.value?.config,
  (c) => {
    if (!c) return
    form.value = {
      providerCode: c.providerCode,
      apiBaseUrl: c.apiBaseUrl ?? '',
      apiToken: '',
      certificateHint: c.certificateHint ?? '',
      useSandbox: c.useSandbox,
      isActive: c.isActive,
    }
  },
  { immediate: true },
)

const providerOptions = computed(() =>
  CPE_PROVIDER_OPTIONS.map((o) => ({
    value: o.value,
    label: data.value?.providerLabels?.[o.value] ?? o.label,
  })),
)

function submit() {
  saveConfig(
    {
      providerCode: form.value.providerCode,
      apiBaseUrl: form.value.apiBaseUrl.trim() || null,
      apiToken: form.value.apiToken.trim() || undefined,
      certificateHint: form.value.certificateHint.trim() || null,
      useSandbox: form.value.useSandbox,
      isActive: form.value.isActive,
    },
    { onSuccess: () => void refetch() },
  )
}
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      icon="lucide:send"
      title="Facturación electrónica"
      subtitle="Proveedor OSE/PSE, certificado y ambiente beta SUNAT por entidad legal."
    />

    <p v-if="activeEntity" class="text-sm text-gray-400 dark:text-gray-500">
      Entidad activa: <strong>{{ activeEntity.code }}</strong> — RUC {{ activeEntity.ruc }}
    </p>

    <div
      v-if="isLoading"
      class="text-sm text-gray-400 dark:text-gray-500"
    >
      Cargando configuración…
    </div>

    <form
      v-else
      class="rounded-2xl border p-5 sm:p-6 space-y-5 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark"
      @submit.prevent="submit"
    >
      <FormSelect
        v-model="form.providerCode"
        label="Proveedor OSE/PSE"
        :options="providerOptions"
      />

      <FormInput
        v-model="form.apiBaseUrl"
        label="URL API del proveedor"
        placeholder="https://api.proveedor.com/v1"
        hint="Opcional para MOCK; requerido para integraciones reales."
      />

      <FormInput
        v-model="form.apiToken"
        label="Token / API key"
        type="password"
        :placeholder="data?.config.hasApiToken ? `Configurado (${data.config.apiTokenHint})` : 'Pegar token del proveedor'"
        hint="No se almacena en texto plano. Dejar vacío para mantener el actual."
      />

      <FormInput
        v-model="form.certificateHint"
        label="Certificado digital (.pfx)"
        placeholder="Ruta o referencia en vault seguro"
        hint="El archivo .pfx no debe subirse al repositorio; usar almacén seguro del cliente."
      />

      <div class="flex flex-col sm:flex-row gap-4">
        <FormCheckbox v-model="form.useSandbox" label="Ambiente beta / sandbox SUNAT" />
        <FormCheckbox v-model="form.isActive" label="Emisión electrónica activa" />
      </div>

      <div
        class="rounded-lg border px-4 py-3 text-sm border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500"
      >
        Con proveedor <strong>MOCK</strong> se genera XML UBL 2.1 y CDR simulado para pruebas sin credenciales SUNAT.
      </div>

      <div class="flex justify-end">
        <BaseButton type="submit" variant="primary" :loading="saving">
          <AppIcon icon="lucide:save" :size="16" class="mr-1" />
          Guardar configuración
        </BaseButton>
      </div>
    </form>
  </div>
</template>
