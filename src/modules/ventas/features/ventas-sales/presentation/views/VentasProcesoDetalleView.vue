<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, AppIcon, FormSelect } from '@shared/components'
import {
  useVentasClosingReadiness,
  useVentasProcessDetail,
  useVentasUpdateProcess,
} from '../../application/useVentasSales'
import type { SaleProcessDetail } from '../../domain/sales.types'
import { useVentasPipelineStages } from '@ventas/configuracion'
import { PROCESS_STATUS_OPTIONS, processStatusLabel } from '../../domain/pipeline.constants'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import SaleProcessFollowUpPanel from '../components/SaleProcessFollowUpPanel.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { stageOptions, labelFor: pipelineStageLabel, query: pipelineConfigQuery } = useVentasPipelineStages()

const {
  data: proc,
  isLoading,
  isError: detailQueryError,
  error: detailFetchError,
  refetch: refetchDetail,
} = useVentasProcessDetail(id)
const complianceParams = computed(() => ({
  propertyId: (proc.value as SaleProcessDetail | undefined)?.property?.id ?? '',
  buyerClientId: (proc.value as SaleProcessDetail | undefined)?.buyer?.id ?? '',
}))
const {
  data: closingReadiness,
  isLoading: loadingReadiness,
  isError: readinessQueryError,
  error: readinessFetchError,
  refetch: refetchReadiness,
} = useVentasClosingReadiness(complianceParams)

const { mutate: updateProc, isPending: saving } = useVentasUpdateProcess()

const stageEdit = ref('')
const statusEdit = ref('')

watch(
  proc,
  (p) => {
    const row = p as SaleProcessDetail | undefined
    if (row) {
      stageEdit.value = row.pipelineStage ?? ''
      statusEdit.value = row.status ?? ''
    }
  },
  { immediate: true },
)

function saveStage() {
  updateProc({
    id: id.value,
    body: {
      pipelineStage: stageEdit.value || undefined,
      status: (statusEdit.value as 'ACTIVE' | 'WON' | 'LOST') || undefined,
    },
  })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)]"
        @click="router.push('/ventas/procesos')"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          {{ (proc as SaleProcessDetail | undefined)?.code ?? 'Proceso' }}
        </h1>
        <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          Seguimiento: notas, actividades y recordatorios (validado con formularios)
        </p>
      </div>
    </div>

    <div
      v-if="pipelineConfigQuery.isError.value"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-warning-light)' }"
    >
      <span :style="{ color: 'var(--color-text-primary)' }">
        No se cargó la configuración de etapas; se muestran valores por defecto.
      </span>
      <span class="text-xs max-w-md" style="color: var(--color-error)">{{
        getApiErrorMessage(pipelineConfigQuery.error.value)
      }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => pipelineConfigQuery.refetch()">
        Reintentar configuración
      </BaseButton>
    </div>

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div
      v-else-if="detailQueryError"
      class="flex flex-col items-center justify-center gap-3 py-16 rounded-xl border px-4 text-center"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="text-sm font-medium max-w-md" style="color: var(--color-error)">{{ getApiErrorMessage(detailFetchError) }}</p>
      <div class="flex flex-wrap justify-center gap-2">
        <BaseButton variant="outline" size="sm" @click="() => refetchDetail()">Reintentar</BaseButton>
        <BaseButton variant="outline" size="sm" @click="router.push('/ventas/procesos')">Volver al listado</BaseButton>
      </div>
    </div>

    <div
      v-else-if="!proc"
      class="flex flex-col items-center justify-center gap-3 py-16 rounded-xl border px-4 text-center"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <p class="text-sm font-medium" :style="{ color: 'var(--color-text-muted)' }">No se encontró el proceso.</p>
      <BaseButton variant="outline" size="sm" @click="router.push('/ventas/procesos')">Volver al listado</BaseButton>
    </div>

    <template v-else-if="proc">
      <div
        class="p-4 rounded-xl border space-y-4"
        :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
      >
        <div class="flex flex-wrap gap-4 items-end">
          <div class="min-w-[200px]">
            <FormSelect v-model="stageEdit" label="Etapa" :options="stageOptions" />
          </div>
          <div class="min-w-[180px]">
            <FormSelect v-model="statusEdit" label="Estado" :options="[...PROCESS_STATUS_OPTIONS]" />
          </div>
          <BaseButton variant="primary" :loading="saving" @click="saveStage">Guardar etapa</BaseButton>
        </div>
        <div class="grid sm:grid-cols-2 gap-2 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          <p>
            <strong :style="{ color: 'var(--color-text-primary)' }">Cliente:</strong>
            {{ (proc as SaleProcessDetail).buyer?.fullName }}
          </p>
          <p>
            <strong :style="{ color: 'var(--color-text-primary)' }">Inmueble:</strong>
            {{ (proc as SaleProcessDetail).property?.code }}
          </p>
          <p>
            <strong :style="{ color: 'var(--color-text-primary)' }">Etapa:</strong>
            {{ pipelineStageLabel((proc as SaleProcessDetail).pipelineStage) }}
          </p>
          <p>
            <strong :style="{ color: 'var(--color-text-primary)' }">Estado:</strong>
            {{ processStatusLabel((proc as SaleProcessDetail).status) }}
          </p>
        </div>
        <div
          class="rounded-lg border p-3"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }"
        >
          <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">
            Cumplimiento para cierre
          </p>
          <p v-if="loadingReadiness" class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
            Validando checklist legal/tributario/compliance...
          </p>
          <div v-else-if="readinessQueryError" class="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
            <span style="color: var(--color-error)">{{ getApiErrorMessage(readinessFetchError) }}</span>
            <BaseButton variant="outline" size="sm" class="self-start sm:ml-auto shrink-0" @click="() => refetchReadiness()">
              Reintentar
            </BaseButton>
          </div>
          <template v-else>
            <p
              class="text-sm mt-1"
              :style="{ color: closingReadiness?.ok ? 'var(--color-success)' : 'var(--color-warning)' }"
            >
              {{
                closingReadiness?.ok
                  ? 'Operación lista para cierre.'
                  : 'Faltan validaciones para habilitar el cierre.'
              }}
            </p>
            <ul
              v-if="!closingReadiness?.ok && closingReadiness?.missing?.length"
              class="mt-2 list-disc pl-5 text-sm"
              :style="{ color: 'var(--color-text-secondary)' }"
            >
              <li v-for="m in closingReadiness.missing" :key="m">{{ m }}</li>
            </ul>
          </template>
        </div>
      </div>

      <SaleProcessFollowUpPanel :process-id="id" layout="grid" />
    </template>
  </div>
</template>
