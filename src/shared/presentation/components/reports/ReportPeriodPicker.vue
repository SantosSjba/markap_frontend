<script setup lang="ts">
import FormInput from '../forms/FormInput.vue'
import FormSelect from '../forms/FormSelect.vue'
import { PERIOD_MODE_OPTIONS, type ReportPeriodMode } from './report-period'
/**
 * Selector del periodo de Reportes (año, mes, rango o todo). Recibe los refs de
 * `useReportPeriod()` con v-model; va en las acciones del encabezado de la página.
 */

defineProps<{
  yearOptions: { value: number; label: string }[]
  monthOptions: { value: number; label: string }[]
}>()
const mode = defineModel<ReportPeriodMode>('mode', { required: true })
const year = defineModel<number>('year', { required: true })
const month = defineModel<number>('month', { required: true })
const startDate = defineModel<string>('startDate', { required: true })
const endDate = defineModel<string>('endDate', { required: true })
</script>

<template>
  <div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-end">
    <FormSelect v-model="mode" :options="PERIOD_MODE_OPTIONS" class="sm:w-40" />
    <FormSelect v-if="mode === 'year' || mode === 'month'" v-model="year" :options="yearOptions" class="sm:w-28" />
    <FormSelect v-if="mode === 'month'" v-model="month" :options="monthOptions" class="col-span-2 sm:col-span-1 sm:w-36" />
    <template v-if="mode === 'range'">
      <FormInput v-model="startDate" type="date" class="sm:w-40" />
      <FormInput v-model="endDate" type="date" class="sm:w-40" />
    </template>
  </div>
</template>
