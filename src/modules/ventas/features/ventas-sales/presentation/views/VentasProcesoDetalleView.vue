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
import SaleProcessFollowUpPanel from '../components/SaleProcessFollowUpPanel.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { stageOptions, labelFor: pipelineStageLabel } = useVentasPipelineStages()

const { data: proc, isLoading } = useVentasProcessDetail(id)
const complianceParams = computed(() => ({
  propertyId: (proc.value as SaleProcessDetail | undefined)?.property?.id ?? '',
  buyerClientId: (proc.value as SaleProcessDetail | undefined)?.buyer?.id ?? '',
}))
const { data: closingReadiness, isLoading: loadingReadiness } =
  useVentasClosingReadiness(complianceParams)

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

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
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
