<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import type { InteriorDocumentType } from '../../domain/document.types'
import { INTERIOR_DOCUMENT_NAV } from '../documentNav'
import InteriorDocumentsTable from '../components/InteriorDocumentsTable.vue'
/** Documentos de todos los proyectos en una sola vista; el tipo se recuerda en `?type=`. */

const route = useRoute()
const router = useRouter()
const isType = (t: unknown): t is InteriorDocumentType => INTERIOR_DOCUMENT_NAV.some((n) => n.docType === t)
const type = ref<'ALL' | InteriorDocumentType>(isType(route.query.type) ? route.query.type : 'ALL')
watch(
  () => route.query.type,
  (t) => (type.value = isType(t) ? t : 'ALL'),
)
watch(type, (t) => {
  const query = { ...route.query }
  if (t === 'ALL') delete query.type
  else query.type = t
  router.replace({ query })
})
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Documentos" subtitle="Contratos, planos, renders, facturas y actas de todos los proyectos" />
    <InteriorDocumentsTable v-model:type="type" />
  </div>
</template>
