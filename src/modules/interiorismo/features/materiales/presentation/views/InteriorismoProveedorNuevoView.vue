<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import { useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { useCreateInteriorMaterialSupplier } from '../composables/useInteriorMaterialSuppliers'
import type { CreateInteriorMaterialSupplierPayload } from '../../domain/suppliers.types'
import InteriorSupplierForm from '../components/InteriorSupplierForm.vue'

const router = useRouter()
const createMut = useCreateInteriorMaterialSupplier()
const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/materiales/proveedores`)

async function onSubmit(payload: CreateInteriorMaterialSupplierPayload) {
  try {
    const created = await createMut.mutateAsync(payload)
    router.replace(`${INTERIORISMO_BASE_PATH}/materiales/proveedores/${created.id}`)
  } catch {
    void 0
  }
}
</script>

<template>
  <div>
    <PageHeader title="Nuevo proveedor" subtitle="Empresa, RUC y contacto" back class="mb-6" @back="goBack" />
    <InteriorSupplierForm submit-label="Registrar proveedor" :submitting="createMut.isPending.value" :can-write="canWrite" @submit="onSubmit" @cancel="goBack" />
  </div>
</template>
