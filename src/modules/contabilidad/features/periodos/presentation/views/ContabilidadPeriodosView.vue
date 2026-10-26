<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import { ref, computed } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import {
  useContabilidadPeriodsList,
  useContabilidadSetPeriodStatus,
} from '../composables/useContabilidadPeriods'
import { CONTABILIDAD_PERIOD_STATUS_LABELS } from '../../domain/period.types'
import type { ContabilidadPeriodDTO } from '../../domain/period.types'
const selectedYear = ref(new Date().getFullYear())

const { data, isLoading, isError, refetch } = useContabilidadPeriodsList(selectedYear)
const { mutate: setStatus, isPending: updating } = useContabilidadSetPeriodStatus()

const periods = computed(() => data.value?.periods ?? [])

function changeYear(delta: number) {
  selectedYear.value += delta
}

async function togglePeriod(period: ContabilidadPeriodDTO) {
  const next = period.status === 'OPEN' ? 'CLOSED' : 'OPEN'
  const ok =
    next === 'CLOSED'
      ? await markapAlert.confirm({
          title: `¿Cerrar ${period.label}?`,
          text: 'No se podrán registrar asientos en este periodo (cierre suave).',
          confirmText: 'Cerrar periodo',
        })
      : true
  if (!ok) return
  setStatus({ id: period.id, status: next }, { onSuccess: () => void refetch() })
}
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      title="Periodos contables"
      subtitle="Apertura y cierre mensual. Los 12 meses del año se generan automáticamente."
    >
      <template #actions>
        <div class="flex items-center gap-2">
        <BaseButton variant="ghost" size="sm" @click="changeYear(-1)">
          <AppIcon icon="lucide:chevron-left" :size="18" />
        </BaseButton>
        <span class="text-lg font-semibold min-w-[4rem] text-center text-gray-800 dark:text-white/90">
          {{ selectedYear }}
        </span>
        <BaseButton variant="ghost" size="sm" @click="changeYear(1)">
          <AppIcon icon="lucide:chevron-right" :size="18" />
        </BaseButton>
      </div>
      </template>
    </PageHeader>

    <LoadingState v-if="isLoading" />

    <BaseCard v-else-if="isError" padding="lg" class="block text-center">
      <BaseButton variant="secondary" @click="refetch()">Reintentar</BaseButton>
    </BaseCard>

    <div
      v-else
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <BaseCard v-for="period in periods" :key="period.id" padding="sm" class="flex flex-col gap-3">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-semibold text-gray-800 dark:text-white/90">{{ period.label }}</p>
            <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
              Mes {{ period.month }} / {{ period.year }}
            </p>
          </div>
          <Badge :variant="period.status === 'OPEN' ? 'primary' : 'neutral'" class="shrink-0">{{ CONTABILIDAD_PERIOD_STATUS_LABELS[period.status as keyof typeof CONTABILIDAD_PERIOD_STATUS_LABELS] }}</Badge>
        </div>
        <BaseButton
          variant="secondary"
          size="sm"
          :loading="updating"
          @click="togglePeriod(period)"
        >
          {{ period.status === 'OPEN' ? 'Cerrar periodo' : 'Reabrir periodo' }}
        </BaseButton>
      </BaseCard>
    </div>
  </div>
</template>
