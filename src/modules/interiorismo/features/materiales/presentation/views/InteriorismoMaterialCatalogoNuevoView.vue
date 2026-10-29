<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import { useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { useCreateInteriorCatalogMaterial } from '../composables/useInteriorCatalogMaterials'
import type { CreateInteriorCatalogMaterialPayload } from '../../domain/catalog.types'
import InteriorMaterialForm from '../components/InteriorMaterialForm.vue'

const router = useRouter()
const createMut = useCreateInteriorCatalogMaterial()
const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/materiales/catalogo`)

async function onSubmit(payload: CreateInteriorCatalogMaterialPayload) {
  try {
    const created = await createMut.mutateAsync(payload)
    router.replace(`${INTERIORISMO_BASE_PATH}/materiales/catalogo/${created.id}`)
  } catch {
    void 0
  }
}
</script>

<template>
  <div>
    <PageHeader title="Nuevo material o producto" subtitle="Datos, precio de referencia, ficha técnica e imágenes" back class="mb-6" @back="goBack" />
    <InteriorMaterialForm submit-label="Registrar en catálogo" :submitting="createMut.isPending.value" :can-write="canWrite" @submit="onSubmit" @cancel="goBack" />
  </div>
</template>
