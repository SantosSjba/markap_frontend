<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  BaseButton,
  AppIcon,
  FormInput,
  FormSelect,
  FormCheckbox,
  PageHeader,
} from '@shared/components'
import { useContabilidadActiveLegalEntity } from '@modules/contabilidad/presentation/composables/useContabilidadActiveLegalEntity'
import {
  useContabilidadCpeProviderConfig,
  useContabilidadSaveCpeProviderConfig,
} from '../../application/useContabilidadCpe'
import { CPE_PROVIDER_OPTIONS } from '../../domain/cpe.types'

const { activeLegalEntityId, entities } = useContabilidadActiveLegalEntity()
const activeEntity = computed(() =>
  entities.value?.find((e) => e.id === activeLegalEntityId.value),
)

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
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[900px] mx-auto">
    <PageHeader
      icon="lucide:send"
      title="Facturación electrónica"
      subtitle="Proveedor OSE/PSE, certificado y ambiente beta SUNAT por entidad legal."
    />

    <p v-if="activeEntity" class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
      Entidad activa: <strong>{{ activeEntity.code }}</strong> — RUC {{ activeEntity.ruc }}
    </p>

    <div
      v-if="isLoading"
      class="text-sm"
      :style="{ color: 'var(--color-text-muted)' }"
    >
      Cargando configuración…
    </div>

    <form
      v-else
      class="rounded-xl border p-5 sm:p-6 space-y-5"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
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
        class="rounded-lg border px-4 py-3 text-sm"
        :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }"
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
