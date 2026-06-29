<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ProduccionWorkOrdersListPanel from '../components/ProduccionWorkOrdersListPanel.vue'
import { PRODUCCION_STAGES } from '../labels'

const route = useRoute()
const stageKey = computed(() => {
  const q = route.query.etapa
  if (typeof q === 'string' && PRODUCCION_STAGES.some((s) => s.key === q)) return q
  return undefined
})

const title = computed(() => {
  const s = PRODUCCION_STAGES.find((x) => x.key === stageKey.value)
  return s ? `Etapa: ${s.label}` : 'Etapas de producción'
})
</script>

<template>
  <ProduccionWorkOrdersListPanel
    :title="title"
    subtitle="OT filtradas por etapa actual (en proceso)."
    status="IN_PROGRESS"
    :stage-key="stageKey"
  />
</template>
