<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import * as yup from 'yup'
import { BaseButton } from '@shared/components'
import { FormInput, FormSelect } from '@shared/components'
import { useCreateAgent } from '../composables/useAgents'
import { useUsers } from '@modules/settings/composables/useUsers'
import type { AgentType } from '../services/agents.service'

const router = useRouter()

const form = ref({
  type: 'EXTERNAL' as AgentType,
  userId: '' as string,
  fullName: '',
  email: '',
  phone: '',
  documentTypeId: '' as string,
  documentNumber: '',
})

const errors = ref<Record<string, string>>({})

const schema = yup.object({
  type: yup.string().oneOf(['INTERNAL', 'EXTERNAL']).required(),
  userId: yup.string().when('type', {
    is: 'INTERNAL',
    then: (s) => s.required('Seleccione el usuario'),
    otherwise: (s) => s.trim(),
  }),
  fullName: yup.string().required('El nombre es requerido').trim(),
  email: yup.string().trim().email('Email inválido').optional(),
  phone: yup.string().trim().optional(),
  documentNumber: yup.string().trim().optional(),
})

const { data: usersList } = useUsers()
const createMutation = useCreateAgent()

const typeOptions = [
  { value: 'EXTERNAL', label: 'Externo (tercero)' },
  { value: 'INTERNAL', label: 'Interno (usuario del sistema)' },
]
const userOptions = computed(() => {
  const list = usersList.value ?? []
  return list.map((u) => ({
    value: u.id,
    label: `${u.firstName} ${u.lastName}`.trim() || u.email,
  }))
})

function fillFromUser(userId: string) {
  const u = usersList.value?.find((x) => x.id === userId)
  if (!u) return
  form.value.fullName = u.fullName?.trim() || `${u.firstName} ${u.lastName}`.trim() || u.email
  form.value.email = u.email ?? ''
}

watch(
  () => form.value.type,
  (t) => {
    if (t === 'INTERNAL' && form.value.userId) fillFromUser(form.value.userId)
  }
)
watch(
  () => form.value.userId,
  (id) => {
    if (form.value.type === 'INTERNAL' && id) fillFromUser(id)
  }
)

const goBack = () => router.push('/alquileres/agentes')

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

  try {
    await createMutation.mutateAsync({
      applicationSlug: 'alquileres',
      type: form.value.type,
      userId: form.value.type === 'INTERNAL' && form.value.userId ? form.value.userId : null,
      fullName: form.value.fullName.trim(),
      email: form.value.email?.trim() || null,
      phone: form.value.phone?.trim() || null,
      documentTypeId: form.value.documentTypeId || null,
      documentNumber: form.value.documentNumber?.trim() || null,
    })
    await createMutation.invalidateList()
    router.push('/alquileres/agentes')
  } catch (error) {
    const msg =
      isAxiosError(error) && (error as any).response?.data?.message
        ? String((error as any).response.data.message)
        : 'Error al crear el agente'
    setError('_form', msg)
  }
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto">
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
          Nuevo Agente
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Registrar agente interno o externo
        </p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <p v-if="errors._form" class="text-sm" :style="{ color: 'var(--color-error)' }">
        {{ errors._form }}
      </p>

      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">
          Datos del agente
        </h2>
        <div class="grid grid-cols-1 gap-4">
          <FormSelect
            v-model="form.type"
            label="Tipo de agente"
            :options="typeOptions"
          />
          <FormSelect
            v-if="form.type === 'INTERNAL'"
            v-model="form.userId"
            label="Usuario (agente interno)"
            :options="userOptions"
            placeholder="Seleccionar usuario..."
            :error="errors.userId"
          />
          <p
            v-if="form.type === 'INTERNAL' && form.userId"
            class="text-xs rounded-md px-3 py-2"
            :style="{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-elevated)' }"
          >
            Se completan nombre y correo con los datos del usuario seleccionado.
          </p>
          <FormInput
            v-model="form.fullName"
            label="Nombre completo"
            placeholder="Nombre o razón social"
            :error="errors.fullName"
            required
          />
          <FormInput
            v-model="form.email"
            type="email"
            label="Email"
            placeholder="correo@ejemplo.com"
            :error="errors.email"
          />
          <FormInput
            v-model="form.phone"
            type="tel"
            label="Teléfono"
            placeholder="Ej. 999 888 777"
          />
        </div>
      </section>

      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" type="button" @click="goBack">
          Cancelar
        </BaseButton>
        <BaseButton type="submit" :loading="createMutation.isPending.value" variant="primary">
          Crear agente
        </BaseButton>
      </div>
    </form>
  </div>
</template>
