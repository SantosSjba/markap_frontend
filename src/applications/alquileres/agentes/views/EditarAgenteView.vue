<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import * as yup from 'yup'
import { BaseButton, AppIcon, Badge } from '@shared/components'
import { FormInput, FormSelect } from '@shared/components'
import { useAgent, useUpdateAgent, useDeleteAgent } from '../composables/useAgents'
import { useUsers } from '@applications/settings/composables/useUsers'
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
const showDeleteConfirm = ref(false)
const showDeactivateConfirm = ref(false)

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
const deleteMutation = useDeleteAgent()

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

watch(agent, (a) => {
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
}, { immediate: true })

watch(() => form.value.userId, (uid) => {
  if (form.value.type === 'INTERNAL' && uid) fillFromUser(uid)
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
    await updateMutation.mutateAsync({
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
    })
    await updateMutation.invalidateList()
    router.push('/alquileres/agentes')
  } catch (error) {
    const msg =
      isAxiosError(error) && (error as any).response?.data?.message
        ? String((error as any).response.data.message)
        : 'Error al actualizar el agente'
    setError('_form', msg)
  }
}

const handleDeactivate = async () => {
  clearErrors()
  showDeactivateConfirm.value = false
  try {
    await updateMutation.mutateAsync({
      id: id.value,
      data: { isActive: false },
    })
    await updateMutation.invalidateList()
    router.push('/alquileres/agentes')
  } catch (error) {
    const msg =
      isAxiosError(error) && (error as any).response?.data?.message
        ? String((error as any).response.data.message)
        : 'Error al desactivar el agente'
    setError('_form', msg)
  }
}

const handleDelete = async () => {
  clearErrors()
  showDeleteConfirm.value = false
  try {
    await deleteMutation.mutateAsync(id.value)
    await deleteMutation.invalidateList()
    router.push('/alquileres/agentes')
  } catch (error) {
    const msg =
      isAxiosError(error) && (error as any).response?.data?.message
        ? String((error as any).response.data.message)
        : 'Error al eliminar el agente'
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
          <AppIcon icon="lucide:pencil" :size="18" color="var(--color-primary)" />
          <h1 class="text-xl font-bold truncate" :style="{ color: 'var(--color-text-primary)' }">
            Editar Agente
          </h1>
        </div>
        <p class="text-sm mt-0.5 truncate" :style="{ color: 'var(--color-text-secondary)' }">
          {{ agent?.fullName ?? 'Cargando...' }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loadingAgent" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
    </div>

    <!-- Error -->
    <div
      v-else-if="agentError || !agent"
      class="flex items-center gap-3 px-4 py-4 rounded-xl"
      :style="{ backgroundColor: 'var(--color-error)15', border: '1px solid var(--color-error)40', color: 'var(--color-error)' }"
    >
      <AppIcon icon="lucide:alert-circle" :size="18" />
      <span class="text-sm font-medium">No se encontró el agente o ocurrió un error.</span>
    </div>

    <form v-else class="grid grid-cols-1 xl:grid-cols-3 gap-5" @submit.prevent="handleSubmit">
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
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Interno (sistema) o externo (tercero)</p>
            </div>
          </div>

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
                Datos del usuario:
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

        <!-- Danger zone -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-error)40' }"
        >
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-error)15' }">
              <AppIcon icon="lucide:shield-alert" :size="17" color="var(--color-error)" />
            </div>
            <div>
              <h2 class="text-base font-semibold" :style="{ color: 'var(--color-error)' }">Zona de peligro</h2>
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Acciones irreversibles sobre este agente</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Desactivar -->
            <div
              class="flex items-start gap-3 p-4 rounded-xl"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
            >
              <AppIcon icon="lucide:user-x" :size="20" color="var(--color-warning, #f59e0b)" class="shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Desactivar agente</p>
                <p class="text-xs mt-0.5 mb-3" :style="{ color: 'var(--color-text-muted)' }">
                  El agente dejará de aparecer en listados activos pero conservará su historial.
                </p>
                <button
                  v-if="!showDeactivateConfirm"
                  type="button"
                  class="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  :style="{ color: '#f59e0b', border: '1px solid #f59e0b40', backgroundColor: '#f59e0b10' }"
                  :disabled="!agent.isActive"
                  @click="showDeactivateConfirm = true"
                >
                  {{ agent.isActive ? 'Desactivar' : 'Ya está inactivo' }}
                </button>
                <div v-else class="flex gap-2">
                  <button
                    type="button"
                    class="text-sm font-medium px-3 py-1.5 rounded-lg text-white transition-colors"
                    style="background-color: #f59e0b"
                    :disabled="updateMutation.isPending.value"
                    @click="handleDeactivate"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    class="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    :style="{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-hover)' }"
                    @click="showDeactivateConfirm = false"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>

            <!-- Eliminar (soft delete) -->
            <div
              class="flex items-start gap-3 p-4 rounded-xl"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
            >
              <AppIcon icon="lucide:trash-2" :size="20" color="var(--color-error)" class="shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Eliminar agente</p>
                <p class="text-xs mt-0.5 mb-3" :style="{ color: 'var(--color-text-muted)' }">
                  Soft delete: no se borra de la base de datos pero se oculta de todos los listados.
                </p>
                <button
                  v-if="!showDeleteConfirm"
                  type="button"
                  class="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  :style="{ color: 'var(--color-error)', border: '1px solid var(--color-error)40', backgroundColor: 'var(--color-error)10' }"
                  @click="showDeleteConfirm = true"
                >
                  Eliminar agente
                </button>
                <div v-else class="flex gap-2">
                  <button
                    type="button"
                    class="text-sm font-medium px-3 py-1.5 rounded-lg text-white transition-colors"
                    :style="{ backgroundColor: 'var(--color-error)' }"
                    :disabled="deleteMutation.isPending.value"
                    @click="handleDelete"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    class="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    :style="{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-hover)' }"
                    @click="showDeleteConfirm = false"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Botones móvil -->
        <div class="xl:hidden flex gap-3">
          <BaseButton
            type="submit"
            variant="primary"
            class="flex-1 flex items-center justify-center gap-2"
            :loading="updateMutation.isPending.value"
          >
            <AppIcon icon="lucide:save" :size="16" />
            Guardar
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
              :style="{ backgroundColor: form.isActive ? 'var(--color-primary)1a' : 'var(--color-surface-elevated)' }"
            >
              <AppIcon
                :icon="form.type === 'INTERNAL' ? 'lucide:user-check' : 'lucide:user-round-cog'"
                :size="22"
                :color="form.isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'"
              />
            </div>
            <div class="min-w-0">
              <p class="font-semibold truncate" :style="{ color: 'var(--color-text-primary)' }">
                {{ form.fullName || agent?.fullName || '—' }}
              </p>
              <div class="flex flex-wrap gap-1 mt-1">
                <Badge :variant="form.type === 'INTERNAL' ? 'info' : 'neutral'">
                  {{ form.type === 'INTERNAL' ? 'Interno' : 'Externo' }}
                </Badge>
                <Badge :variant="form.isActive ? 'success' : 'error'">
                  {{ form.isActive ? 'Activo' : 'Inactivo' }}
                </Badge>
              </div>
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
              :loading="updateMutation.isPending.value"
            >
              <AppIcon icon="lucide:save" :size="16" />
              Guardar cambios
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
