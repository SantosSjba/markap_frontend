<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { ARQUITECTURA_BASE_PATH } from '../../../../config/routes.constants'
import { useCreateArquitecturaMaterialSupplier } from '../composables/useArquitecturaMaterialSuppliers'
const router = useRouter()
const createMut = useCreateArquitecturaMaterialSupplier()

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
    await router.replace(`${ARQUITECTURA_BASE_PATH}/materiales/proveedores/${created.id}`)
  } finally {
    saving.value = false
  }
}

const goBack = () => router.push(`${ARQUITECTURA_BASE_PATH}/materiales/proveedores`)
</script>

<template>
  <div class="max-w-[640px] mx-auto space-y-6">
    <PageHeader
      title="Nuevo proveedor"
      subtitle="Datos generales; podrá vincular materiales del catálogo desde la ficha."
    >
      <template #actions>
        <BaseButton variant="ghost" type="button" @click="goBack">
        <AppIcon icon="lucide:arrow-left" :size="18" class="mr-1.5" />
        Volver
      </BaseButton>
      </template>
    </PageHeader>

    <BaseCard class="block space-y-4">
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
    </BaseCard>
  </div>
</template>
