<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, FormInput, AppIcon } from '@shared/components'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'
import { useCreateInteriorMaterialSupplier } from '../../application/useInteriorMaterialSuppliers'

const router = useRouter()
const createMut = useCreateInteriorMaterialSupplier()

const companyName = ref('')
const ruc = ref('')
const contactName = ref('')
const phone = ref('')
const email = ref('')
const saving = ref(false)

async function submit() {
  if (!companyName.value.trim() || !ruc.value.trim()) return
  saving.value = true
  try {
    const created = await createMut.mutateAsync({
      companyName: companyName.value.trim(),
      ruc: ruc.value.trim(),
      contactName: contactName.value.trim() || null,
      phone: phone.value.trim() || null,
      email: email.value.trim() || null,
    })
    await router.replace(`${INTERIORISMO_BASE_PATH}/materiales/proveedores/${created.id}`)
  } finally {
    saving.value = false
  }
}

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/materiales/proveedores`)
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[640px] mx-auto space-y-6">
    <div class="flex flex-wrap items-center gap-3 justify-between">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Nuevo proveedor</h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Datos generales; podrá vincular materiales del catálogo desde la ficha.
        </p>
      </div>
      <BaseButton variant="ghost" type="button" @click="goBack">
        <AppIcon icon="lucide:arrow-left" :size="18" class="mr-1.5" />
        Volver
      </BaseButton>
    </div>

    <div
      class="space-y-4 p-4 sm:p-6 rounded-xl border"
      :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
    >
      <FormInput v-model="companyName" label="Empresa" required />
      <FormInput v-model="ruc" label="RUC" required />
      <FormInput v-model="contactName" label="Contacto" placeholder="Nombre del contacto" />
      <div class="grid sm:grid-cols-2 gap-4">
        <FormInput v-model="phone" label="Teléfono" type="tel" />
        <FormInput v-model="email" label="Correo" type="email" />
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="secondary" type="button" @click="goBack">Cancelar</BaseButton>
        <BaseButton variant="primary" type="button" :loading="saving" @click="submit">
          Crear proveedor
        </BaseButton>
      </div>
    </div>
  </div>
</template>
