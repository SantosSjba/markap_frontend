<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import * as yup from 'yup'
import { BaseButton, AppIcon, Badge } from '@shared/components'
import { FormInput, FormSelect } from '@shared/components'
import { useCreateAgent } from '../composables/useAgents'
import { useUsers } from '@applications/settings/composables/useUsers'
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

const userOptions = computed(() => {
  const list = usersList.value ?? []
  return list.map((u) => ({
    value: u.id,
    label: `${u.firstName} ${u.lastName}`.trim() || u.email,
  }))
})

const selectedUser = computed(() => {
  if (form.value.type !== 'INTERNAL' || !form.value.userId) return null
  return usersList.value?.find((u) => u.id === form.value.userId) ?? null
})

function fillFromUser(userId: string) {
  const u = usersList.value?.find((x) => x.id === userId)
  if (!u) return
  form.value.fullName = u.fullName?.trim() || `${u.firstName} ${u.lastName}`.trim() || u.email
  form.value.email = u.email ?? ''
}

watch(() => form.value.type, (t) => {
  if (t === 'INTERNAL' && form.value.userId) fillFromUser(form.value.userId)
})
watch(() => form.value.userId, (id) => {
  if (form.value.type === 'INTERNAL' && id) fillFromUser(id)
})

const goBack = () => router.push('/alquileres/agentes')
const setError = (field: string, message: string) => { errors.value[field] = message }
const clearErrors = () => { errors.value = {} }

const handleSubmit = async () => {
  clearErrors()
  try {
    await schema.validate(form.value, { abortEarly: false })
  } catch (e) {
    if (e instanceof yup.ValidationError) {
      e.inner.forEach((err) => { if (err.path) setError(err.path, err.message) })
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
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <button
        type="button"
        class="p-2 rounded-lg transition-colors hover:bg-[var(--color-hover)] shrink-0"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="goBack"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <AppIcon icon="lucide:user-plus" :size="18" color="var(--color-primary)" />
          <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
            Nuevo Agente
          </h1>
        </div>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Registrar agente interno o externo
        </p>
      </div>
    </div>

    <form class="grid grid-cols-1 xl:grid-cols-3 gap-5" @submit.prevent="handleSubmit">
      <!-- Error global -->
      <div
        v-if="errors._form"
        class="xl:col-span-3 flex items-center gap-3 px-4 py-3 rounded-lg"
        :style="{ backgroundColor: 'var(--color-error)15', border: '1px solid var(--color-error)40', color: 'var(--color-error)' }"
      >
        <AppIcon icon="lucide:alert-circle" :size="18" />
        <span class="text-sm font-medium">{{ errors._form }}</span>
      </div>

      <!-- Columna principal -->
      <div class="xl:col-span-2 space-y-5">

        <!-- Tipo de agente -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
              <AppIcon icon="lucide:users" :size="17" color="var(--color-primary)" />
            </div>
            <div>
              <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Tipo de agente</h2>
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">¿Es un usuario del sistema o un tercero?</p>
            </div>
          </div>

          <!-- Selector de tipo como botones -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
              :style="{
                borderColor: form.type === 'EXTERNAL' ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: form.type === 'EXTERNAL' ? 'var(--color-primary)0d' : 'var(--color-surface-elevated)',
              }"
              @click="form.type = 'EXTERNAL'"
            >
              <AppIcon
                icon="lucide:user-round-cog"
                :size="24"
                :color="form.type === 'EXTERNAL' ? 'var(--color-primary)' : 'var(--color-text-muted)'"
              />
              <div class="text-center">
                <p class="text-sm font-semibold" :style="{ color: form.type === 'EXTERNAL' ? 'var(--color-primary)' : 'var(--color-text-primary)' }">Externo</p>
                <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Tercero / inmobiliaria</p>
              </div>
            </button>
            <button
              type="button"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
              :style="{
                borderColor: form.type === 'INTERNAL' ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: form.type === 'INTERNAL' ? 'var(--color-primary)0d' : 'var(--color-surface-elevated)',
              }"
              @click="form.type = 'INTERNAL'"
            >
              <AppIcon
                icon="lucide:user-check"
                :size="24"
                :color="form.type === 'INTERNAL' ? 'var(--color-primary)' : 'var(--color-text-muted)'"
              />
              <div class="text-center">
                <p class="text-sm font-semibold" :style="{ color: form.type === 'INTERNAL' ? 'var(--color-primary)' : 'var(--color-text-primary)' }">Interno</p>
                <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Usuario del sistema</p>
              </div>
            </button>
          </div>

          <!-- Si es interno: selector de usuario -->
          <div v-if="form.type === 'INTERNAL'" class="space-y-3">
            <FormSelect
              v-model="form.userId"
              label="Seleccionar usuario del sistema"
              :options="userOptions"
              placeholder="Seleccionar usuario..."
              :error="errors.userId"
            />
            <div
              v-if="selectedUser"
              class="flex items-center gap-3 px-4 py-3 rounded-lg"
              :style="{ backgroundColor: 'var(--color-primary)0d', border: '1px solid var(--color-primary)33' }"
            >
              <AppIcon icon="lucide:circle-check" :size="16" color="var(--color-primary)" />
              <div class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
                Datos completados desde:
                <strong :style="{ color: 'var(--color-text-primary)' }">{{ selectedUser.email }}</strong>
              </div>
            </div>
          </div>
        </section>

        <!-- Datos del agente -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
              <AppIcon icon="lucide:contact" :size="17" color="var(--color-primary)" />
            </div>
            <div>
              <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Datos del agente</h2>
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Nombre y datos de contacto</p>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              v-model="form.fullName"
              class="sm:col-span-2"
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
            <FormInput
              v-model="form.documentNumber"
              label="N° Documento"
              placeholder="RUC / DNI"
            />
          </div>
        </section>

        <!-- Botones móvil -->
        <div class="xl:hidden flex gap-3">
          <BaseButton
            type="submit"
            variant="primary"
            class="flex-1 flex items-center justify-center gap-2"
            :loading="createMutation.isPending.value"
          >
            <AppIcon icon="lucide:save" :size="16" />
            Crear agente
          </BaseButton>
          <BaseButton type="button" variant="outline" class="flex items-center gap-2" @click="goBack">
            <AppIcon icon="lucide:x" :size="16" />
            Cancelar
          </BaseButton>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="xl:col-span-1">
        <div
          class="p-5 rounded-xl border sticky top-4"
          :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
        >
          <h2 class="text-base font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">
            Resumen del agente
          </h2>

          <div class="flex items-center gap-3 mb-4">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              :style="{ backgroundColor: 'var(--color-primary)1a' }"
            >
              <AppIcon
                :icon="form.type === 'INTERNAL' ? 'lucide:user-check' : 'lucide:user-round-cog'"
                :size="22"
                color="var(--color-primary)"
              />
            </div>
            <div class="min-w-0">
              <p class="font-semibold truncate" :style="{ color: 'var(--color-text-primary)' }">
                {{ form.fullName || 'Sin nombre' }}
              </p>
              <Badge :variant="form.type === 'INTERNAL' ? 'info' : 'neutral'" class="mt-1">
                {{ form.type === 'INTERNAL' ? 'Interno' : 'Externo' }}
              </Badge>
            </div>
          </div>

          <dl class="space-y-2.5 text-sm mb-6">
            <div v-if="form.email">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:mail" :size="13" />
                Email
              </dt>
              <dd class="truncate" :style="{ color: 'var(--color-text-primary)' }">{{ form.email }}</dd>
            </div>
            <div v-if="form.phone">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:phone" :size="13" />
                Teléfono
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ form.phone }}</dd>
            </div>
            <div v-if="form.documentNumber">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:id-card" :size="13" />
                Documento
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ form.documentNumber }}</dd>
            </div>
          </dl>

          <div class="hidden xl:flex flex-col gap-3">
            <BaseButton
              type="submit"
              variant="primary"
              class="w-full flex items-center justify-center gap-2"
              :loading="createMutation.isPending.value"
            >
              <AppIcon icon="lucide:save" :size="16" />
              Crear agente
            </BaseButton>
            <BaseButton type="button" variant="outline" class="w-full flex items-center justify-center gap-2" @click="goBack">
              <AppIcon icon="lucide:x" :size="16" />
              Cancelar
            </BaseButton>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
