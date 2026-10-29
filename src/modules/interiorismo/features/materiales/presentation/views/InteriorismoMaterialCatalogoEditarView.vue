<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { useInteriorCatalogMaterialDetail, useUpdateInteriorCatalogMaterial } from '../composables/useInteriorCatalogMaterials'
import type { CreateInteriorCatalogMaterialPayload } from '../../domain/catalog.types'
import InteriorMaterialForm from '../components/InteriorMaterialForm.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))
const { data: material, isLoading } = useInteriorCatalogMaterialDetail(id)
const updateMut = useUpdateInteriorCatalogMaterial(id)
const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/materiales/catalogo/${id.value}`)

async function onSubmit({ code: _code, ...payload }: CreateInteriorCatalogMaterialPayload) {
  try {
    await updateMut.mutateAsync(payload)
    goBack()
  } catch {
    void 0
  }
}
</script>

<template>
  <div>
    <PageHeader title="Editar material" :subtitle="material ? `${material.code} · ${material.name}` : 'Cargando…'" back class="mb-6" @back="goBack" />
    <LoadingState v-if="isLoading" class="py-24" />
    <InteriorMaterialForm v-else-if="material" :initial="material" submit-label="Guardar cambios" :submitting="updateMut.isPending.value" :can-write="canWrite" @submit="onSubmit" @cancel="goBack" />
  </div>
</template>
