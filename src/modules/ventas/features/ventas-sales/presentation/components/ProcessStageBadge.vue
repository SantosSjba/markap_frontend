<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { useVentasPipelineStages } from '../../../ventas-configuracion/presentation/composables/useVentasConfig'
import { pipelineStageMeta } from '../../domain/pipeline.constants'
/** ProcessStageBadge — etapa del pipeline con su icono y color (listado, pipeline y detalle). */

const props = defineProps<{ stage: string }>()

const { labelFor } = useVentasPipelineStages()
const meta = computed(() => pipelineStageMeta(props.stage))
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-theme-xs font-medium whitespace-nowrap"
    :style="{ color: meta.color, backgroundColor: `color-mix(in srgb, ${meta.color} 14%, transparent)` }"
  >
    <AppIcon :icon="meta.icon" :size="12" />
    {{ labelFor(stage) }}
  </span>
</template>
