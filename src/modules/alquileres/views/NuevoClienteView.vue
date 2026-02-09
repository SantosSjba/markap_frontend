<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import * as yup from 'yup'
import { BaseButton } from '@shared/components'
import { FormInput, FormSelect, FormTextarea } from '@shared/components'
import { useDocumentTypes, useDistricts, useCreateClient } from '../composables/useClients'
import type { DocumentType, District } from '../services/clients.service'

const router = useRouter()
const appColor = 'var(--color-primary)'

const clientType = ref<'OWNER' | 'TENANT' | 'BOTH'>('OWNER')

const form = ref({
  documentTypeId: '',
  documentNumber: '',
  fullName: '',
  legalRepresentativeName: '',
  legalRepresentativePosition: '',
  primaryPhone: '',
  secondaryPhone: '',
  primaryEmail: '',
  secondaryEmail: '',
  addressLine: '',
  districtId: '',
  reference: '',
  notes: '',
})

const errors = ref<Record<string, string>>({})

const schema = yup.object({
  documentTypeId: yup.string().required('Seleccione el tipo de documento'),
  documentNumber: yup.string().required('El número de documento es requerido').trim(),
  fullName: yup.string().required('El nombre es requerido').trim(),
  legalRepresentativeName: yup.string().trim(),
  legalRepresentativePosition: yup.string().trim(),
  primaryPhone: yup.string().required('El teléfono principal es requerido').trim(),
  secondaryPhone: yup.string().trim(),
  primaryEmail: yup
    .string()
    .required('El email principal es requerido')
    .email('Email inválido')
    .trim(),
  secondaryEmail: yup
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .email('Email inválido')
    .optional(),
  addressLine: yup.string().required('La dirección es requerida').trim(),
  districtId: yup.string().required('Seleccione el distrito'),
  reference: yup.string().trim(),
  notes: yup.string().trim(),
})

const { data: documentTypes, isLoading: loadingDocs } = useDocumentTypes()
const { data: districts, isLoading: loadingDistricts } = useDistricts()
const createMutation = useCreateClient()

const loading = computed(() => loadingDocs.value || loadingDistricts.value)

const selectedDistrict = computed(() =>
  (districts.value ?? []).find((d: District) => d.id === form.value.districtId)
)
const provinceName = computed(() => selectedDistrict.value?.province?.name ?? '')
const departmentName = computed(
  () => selectedDistrict.value?.province?.department?.name ?? ''
)

const documentTypeOptions = computed(() =>
  (documentTypes.value ?? []).map((d: DocumentType) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }))
)
const districtOptions = computed(() =>
  (districts.value ?? []).map((d: District) => ({ value: d.id, label: d.name }))
)

const goBack = () => router.push('/alquileres/clientes')
const selectClientType = (type: 'OWNER' | 'TENANT' | 'BOTH') => {
  clientType.value = type
}

const setError = (field: string, message: string) => {
  errors.value[field] = message
}
const clearErrors = () => {
  errors.value = {}
}

const handleSubmit = async () => {
  clearErrors()
  try {
    await schema.validate(form.value, { abortEarly: false })
  } catch (e) {
    if (e instanceof yup.ValidationError) {
      e.inner.forEach((err) => {
        if (err.path) setError(err.path, err.message)
      })
      return
    }
    throw e
  }

  createMutation.mutate(
    {
      applicationSlug: 'alquileres',
      clientType: clientType.value,
      documentTypeId: form.value.documentTypeId,
      documentNumber: form.value.documentNumber.trim(),
      fullName: form.value.fullName.trim(),
      legalRepresentativeName: form.value.legalRepresentativeName.trim() || null,
      legalRepresentativePosition:
        form.value.legalRepresentativePosition.trim() || null,
      primaryPhone: form.value.primaryPhone.trim(),
      secondaryPhone: form.value.secondaryPhone.trim() || null,
      primaryEmail: form.value.primaryEmail.trim(),
      secondaryEmail: form.value.secondaryEmail.trim() || null,
      notes: form.value.notes.trim() || null,
      address: {
        addressLine: form.value.addressLine.trim(),
        districtId: form.value.districtId,
        reference: form.value.reference.trim() || null,
      },
    },
    {
      onSuccess: () => router.push('/alquileres/clientes'),
      onError: (error: Error) => {
        const msg =
          isAxiosError(error) && error.response?.data?.message
            ? String(error.response.data.message)
            : 'Error al guardar el cliente'
        setError('_form', msg)
      },
    }
  )
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)]"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="goBack"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Nuevo Cliente
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Registrar un nuevo propietario o inquilino
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <svg
        class="animate-spin h-8 w-8"
        :style="{ color: appColor }"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-8">
      <p v-if="errors._form" class="text-sm" :style="{ color: 'var(--color-error)' }">
        {{ errors._form }}
      </p>

      <!-- Tipo de Cliente -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Tipo de Cliente
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Selecciona el tipo de cliente a registrar
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            class="p-4 rounded-lg border-2 text-left transition-all"
            :style="{
              borderColor: clientType === 'OWNER' ? appColor : 'var(--color-border)',
              color: clientType === 'OWNER' ? appColor : 'var(--color-text-primary)',
            }"
            @click="selectClientType('OWNER')"
          >
            <div class="flex items-center gap-3">
              <svg class="w-8 h-8 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <span class="font-medium block">Propietario</span>
                <span class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                  Dueño de propiedad en administración
                </span>
              </div>
            </div>
          </button>
          <button
            type="button"
            class="p-4 rounded-lg border-2 text-left transition-all"
            :style="{
              borderColor: clientType === 'TENANT' ? appColor : 'var(--color-border)',
              color: clientType === 'TENANT' ? appColor : 'var(--color-text-primary)',
            }"
            @click="selectClientType('TENANT')"
          >
            <div class="flex items-center gap-3">
              <svg class="w-8 h-8 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <span class="font-medium block">Inquilino</span>
                <span class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                  Persona que alquila una propiedad
                </span>
              </div>
            </div>
          </button>
          <button
            type="button"
            class="p-4 rounded-lg border-2 text-left transition-all"
            :style="{
              borderColor: clientType === 'BOTH' ? appColor : 'var(--color-border)',
              color: clientType === 'BOTH' ? appColor : 'var(--color-text-primary)',
            }"
            @click="selectClientType('BOTH')"
          >
            <div class="flex items-center gap-3">
              <svg class="w-8 h-8 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <span class="font-medium block">Ambos</span>
                <span class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                  Es propietario e inquilino
                </span>
              </div>
            </div>
          </button>
        </div>
      </section>

      <!-- Información Personal -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Información Personal
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Datos básicos del cliente
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect
            v-model="form.documentTypeId"
            label="Tipo de Documento"
            placeholder="Seleccionar"
            :options="documentTypeOptions"
            :error="errors.documentTypeId"
            required
          />
          <FormInput
            v-model="form.documentNumber"
            label="Número de Documento"
            placeholder="12345678"
            :error="errors.documentNumber"
            required
          />
          <FormInput
            v-model="form.fullName"
            class="md:col-span-2"
            label="Nombre Completo / Razón Social"
            placeholder="Juan Pérez / Empresa SAC"
            :error="errors.fullName"
            required
          />
          <FormInput
            v-model="form.legalRepresentativeName"
            label="Representante Legal (si aplica)"
            placeholder="Nombre del representante"
            :error="errors.legalRepresentativeName"
          />
          <FormInput
            v-model="form.legalRepresentativePosition"
            label="Cargo"
            placeholder="Gerente General"
            :error="errors.legalRepresentativePosition"
          />
        </div>
      </section>

      <!-- Información de Contacto -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Información de Contacto
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Datos para comunicación
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            v-model="form.primaryPhone"
            type="tel"
            label="Teléfono Principal"
            placeholder="999-888-777"
            :error="errors.primaryPhone"
            required
          />
          <FormInput
            v-model="form.secondaryPhone"
            type="tel"
            label="Teléfono Secundario"
            placeholder="999-888-777"
            :error="errors.secondaryPhone"
          />
          <FormInput
            v-model="form.primaryEmail"
            type="email"
            label="Email Principal"
            placeholder="correo@ejemplo.com"
            :error="errors.primaryEmail"
            required
          />
          <FormInput
            v-model="form.secondaryEmail"
            type="email"
            label="Email Secundario"
            placeholder="correo@ejemplo.com"
            :error="errors.secondaryEmail"
          />
        </div>
      </section>

      <!-- Dirección -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Dirección
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Dirección de residencia o fiscal
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            v-model="form.addressLine"
            class="md:col-span-2"
            label="Dirección"
            placeholder="Av. Principal 123, Dpto 501"
            :error="errors.addressLine"
            required
          />
          <FormSelect
            v-model="form.districtId"
            label="Distrito"
            placeholder="Seleccionar distrito"
            :options="districtOptions"
            :error="errors.districtId"
            required
          />
          <FormInput
            :model-value="provinceName"
            label="Provincia"
            placeholder="Lima"
            disabled
          />
          <FormInput
            :model-value="departmentName"
            label="Departamento"
            placeholder="Lima"
            disabled
          />
        </div>
      </section>

      <!-- Notas Adicionales -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Notas Adicionales
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Información relevante sobre el cliente
        </p>
        <FormTextarea
          v-model="form.notes"
          label="Notas"
          placeholder="Notas, observaciones, preferencias del cliente..."
          :rows="4"
        />
      </section>

      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" type="button" @click="goBack">
          Cancelar
        </BaseButton>
        <BaseButton type="submit" :loading="createMutation.isPending.value" variant="primary">
          <svg v-if="!createMutation.isPending.value" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Guardar Cliente
        </BaseButton>
      </div>
    </form>
  </div>
</template>
