<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import * as yup from 'yup'
import { BaseButton } from '@shared/components'
import { FormInput, FormSelect, FormCheckbox } from '@shared/components'
import { useAgent, useUpdateAgent } from '../composables/useAgents'
import { useUsers } from '@modules/settings/composables/useUsers'
import type { AgentType } from '../services/agents.service'

const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const form = ref({
  type: 'EXTERNAL' as AgentType,
  userId: '' as string,
  fullName: '',
  email: '',
  phone: '',
  documentTypeId: '' as string,
  documentNumber: '',
  isActive: true,
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
  isActive: yup.boolean().required(),
})

const { data: agent, isLoading: loadingAgent, isError: agentError } = useAgent(id)
const { data: usersList } = useUsers()
const updateMutation = useUpdateAgent()

watch(
  agent,
  (a) => {
    if (!a) return
    form.value = {
      type: a.type,
      userId: a.userId ?? '',
      fullName: a.fullName ?? '',
      email: a.email ?? '',
      phone: a.phone ?? '',
      documentTypeId: a.documentTypeId ?? '',
      documentNumber: a.documentNumber ?? '',
      isActive: a.isActive,
    }
  },
  { immediate: true }
)

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

  updateMutation.mutate(
    {
      id: id.value,
      data: {
        type: form.value.type,
        userId: form.value.type === 'INTERNAL' && form.value.userId ? form.value.userId : null,
        fullName: form.value.fullName.trim(),
        email: form.value.email?.trim() || null,
        phone: form.value.phone?.trim() || null,
        documentTypeId: form.value.documentTypeId || null,
        documentNumber: form.value.documentNumber?.trim() || null,
        isActive: form.value.isActive,
      },
    },
    {
      onSuccess: () => router.push('/alquileres/agentes'),
      onError: (error: Error) => {
        const msg =
          isAxiosError(error) && error.response?.data?.message
            ? String(error.response.data.message)
            : 'Error al actualizar el agente'
        setError('_form', msg)
      },
    }
  )
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-3 sm:px-5 py-6 sm:py-8">
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
          Editar Agente
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          {{ agent?.fullName ?? 'Agente' }}
        </p>
      </div>
    </div>

    <div v-if="loadingAgent" class="flex justify-center py-16">
      <svg
        class="animate-spin h-8 w-8"
        style="color: var(--color-primary)"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <p v-else-if="agentError || !agent" class="text-sm py-8" :style="{ color: 'var(--color-error)' }">
      No se encontró el agente o ocurrió un error.
    </p>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
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
          <FormCheckbox v-model="form.isActive" label="Activo" />
        </div>
      </section>

      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" type="button" @click="goBack">
          Cancelar
        </BaseButton>
        <BaseButton type="submit" :loading="updateMutation.isPending.value" variant="primary">
          Guardar cambios
        </BaseButton>
      </div>
    </form>
  </div>
</template>
