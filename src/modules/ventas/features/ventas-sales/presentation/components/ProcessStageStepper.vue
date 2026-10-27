<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { useVentasPipelineStages } from '../../../ventas-configuracion/presentation/composables/useVentasConfig'
import { normalizePipelineStage, pipelineStageMeta } from '../../domain/pipeline.constants'
/**
 * ProcessStageStepper — avance del proceso por las etapas del pipeline:
 * completadas (check), actual (resaltada) y pendientes. Un proceso ganado tiene todas completas.
 */

const props = defineProps<{ stage: string; status: string }>()

const { stageOptions } = useVentasPipelineStages()

const currentIndex = computed(() =>
  stageOptions.value.findIndex((s) => s.value === normalizePipelineStage(props.stage)),
)

const steps = computed(() =>
  stageOptions.value.map((s, i) => {
    const state =
      props.status === 'WON' || i < currentIndex.value ? 'done' : i === currentIndex.value ? 'current' : 'todo'
    return { ...s, meta: pipelineStageMeta(s.value), state }
  }),
)
</script>

<template>
  <ol class="flex w-full items-start" :class="{ 'opacity-60': status === 'LOST' }">
    <li v-for="(step, i) in steps" :key="step.value" class="relative flex flex-1 flex-col items-center text-center">
      <!-- Conector con la etapa anterior -->
      <span
        v-if="i > 0"
        class="absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2"
        :class="step.state === 'todo' ? 'bg-gray-200 dark:bg-gray-800' : 'bg-brand-500'"
      />
      <span
        class="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors"
        :class="
          step.state === 'done'
            ? 'border-brand-500 bg-brand-500 text-white'
            : step.state === 'current'
              ? 'bg-white dark:bg-gray-900'
              : 'border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500'
        "
        :style="step.state === 'current' ? { borderColor: step.meta.color, color: step.meta.color } : undefined"
      >
        <AppIcon :icon="step.state === 'done' ? 'lucide:check' : step.meta.icon" :size="15" />
      </span>
      <span
        class="mt-2 px-1 text-theme-xs leading-tight"
        :class="step.state === 'todo' ? 'text-gray-400 dark:text-gray-500' : 'font-medium text-gray-800 dark:text-white/90'"
      >
        {{ step.label }}
      </span>
    </li>
  </ol>
</template>
