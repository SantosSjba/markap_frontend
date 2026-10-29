<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { useInteriorMaterialSupplierDetail, useUpdateInteriorMaterialSupplier } from '../composables/useInteriorMaterialSuppliers'
import type { CreateInteriorMaterialSupplierPayload } from '../../domain/suppliers.types'
import InteriorSupplierForm from '../components/InteriorSupplierForm.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))
const { data: supplier, isLoading } = useInteriorMaterialSupplierDetail(id)
const updateMut = useUpdateInteriorMaterialSupplier(id)
const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/materiales/proveedores/${id.value}`)

async function onSubmit(payload: CreateInteriorMaterialSupplierPayload) {
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
    <PageHeader title="Editar proveedor" :subtitle="supplier ? `${supplier.companyName} · RUC ${supplier.ruc}` : 'Cargando…'" back class="mb-6" @back="goBack" />
    <LoadingState v-if="isLoading" class="py-24" />
    <InteriorSupplierForm v-else-if="supplier" :initial="supplier" submit-label="Guardar cambios" :submitting="updateMut.isPending.value" :can-write="canWrite" @submit="onSubmit" @cancel="goBack" />
  </div>
</template>
