<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import { BaseButton, AppIcon, Badge } from '@shared/components'
import { FormInput, FormSelect } from '@shared/components'
import { useForm, toTypedSchema } from '@shared/forms'
import { useAgent, useUpdateAgent, useDeleteAgent } from '../../application/useAgents'
import { useUsers } from '@modules/settings'
import type { AgentType } from '../../domain/agent.types'

const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const showDeleteConfirm = ref(false)
const showDeactivateConfirm = ref(false)
const showActivateConfirm = ref(false)

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
  documentTypeId: yup.string().trim().optional(),
  documentNumber: yup.string().trim().optional(),
  isActive: yup.boolean().required(),
})

const { values, handleSubmit, errors, defineComponentBinds, setFieldValue, resetForm } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    type: 'EXTERNAL' as AgentType,
    userId: '',
    fullName: '',
    email: '',
    phone: '',
    documentTypeId: '',
    documentNumber: '',
    isActive: true,
  },
})

const userIdBinds = defineComponentBinds('userId')
const fullNameBinds = defineComponentBinds('fullName')
const emailBinds = defineComponentBinds('email')
const phoneBinds = defineComponentBinds('phone')
const documentNumberBinds = defineComponentBinds('documentNumber')

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
  if (values.type !== 'INTERNAL' || !values.userId) return null
  return usersList.value?.find((u) => u.id === values.userId) ?? null
})

function fillFromUser(userId: string) {
  const u = usersList.value?.find((x) => x.id === userId)
  if (!u) return
  setFieldValue(
    'fullName',
    u.fullName?.trim() || `${u.firstName} ${u.lastName}`.trim() || u.email,
  )
  setFieldValue('email', u.email ?? '')
}

watch(agent, (a) => {
  if (!a) return
  resetForm({
    values: {
      type: a.type,
      userId: a.userId ?? '',
      fullName: a.fullName ?? '',
      email: a.email ?? '',
      phone: a.phone ?? '',
      documentTypeId: a.documentTypeId ?? '',
      documentNumber: a.documentNumber ?? '',
      isActive: a.isActive,
    },
  })
}, { immediate: true })

watch(
  () => values.type,
  (t) => {
    if (t === 'INTERNAL' && values.userId) fillFromUser(values.userId)
  },
)
watch(
  () => values.userId,
  (uid) => {
    if (values.type === 'INTERNAL' && uid) fillFromUser(uid)
  },
)

const goBack = () => router.push('/alquileres/agentes')

const onSubmit = handleSubmit(async (formValues) => {
  try {
    await updateMutation.mutateAsync({
      id: id.value,
      data: {
        type: formValues.type,
        userId: formValues.type === 'INTERNAL' && formValues.userId ? formValues.userId : null,
        fullName: formValues.fullName.trim(),
        email: formValues.email?.trim() || null,
        phone: formValues.phone?.trim() || null,
        documentTypeId: formValues.documentTypeId || null,
        documentNumber: formValues.documentNumber?.trim() || null,
        isActive: formValues.isActive,
      },
    })
    router.push('/alquileres/agentes')
  } catch {
    void 0
  }
})

const handleDeactivate = async () => {
  showDeactivateConfirm.value = false
  try {
    await updateMutation.mutateAsync({
      id: id.value,
      data: { isActive: false },
    })
    router.push('/alquileres/agentes')
  } catch {
    void 0
  }
}

const handleActivate = async () => {
  showActivateConfirm.value = false
  try {
    await updateMutation.mutateAsync({
      id: id.value,
      data: { isActive: true },
    })
    router.push('/alquileres/agentes')
  } catch {
    void 0
  }
}

const handleDelete = async () => {
  showDeleteConfirm.value = false
  try {
    await deleteMutation.mutateAsync(id.value)
    router.push('/alquileres/agentes')
  } catch {
    void 0
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

    <form v-else class="grid grid-cols-1 xl:grid-cols-3 gap-5" @submit.prevent="onSubmit">
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
                borderColor: values.type === 'EXTERNAL' ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: values.type === 'EXTERNAL' ? 'var(--color-primary)0d' : 'var(--color-surface-elevated)',
              }"
              @click="setFieldValue('type', 'EXTERNAL')"
            >
              <AppIcon
                icon="lucide:user-round-cog"
                :size="24"
                :color="values.type === 'EXTERNAL' ? 'var(--color-primary)' : 'var(--color-text-muted)'"
              />
              <div class="text-center">
                <p class="text-sm font-semibold" :style="{ color: values.type === 'EXTERNAL' ? 'var(--color-primary)' : 'var(--color-text-primary)' }">Externo</p>
                <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Tercero / inmobiliaria</p>
              </div>
            </button>
            <button
              type="button"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
              :style="{
                borderColor: values.type === 'INTERNAL' ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: values.type === 'INTERNAL' ? 'var(--color-primary)0d' : 'var(--color-surface-elevated)',
              }"
              @click="setFieldValue('type', 'INTERNAL')"
            >
              <AppIcon
                icon="lucide:user-check"
                :size="24"
                :color="values.type === 'INTERNAL' ? 'var(--color-primary)' : 'var(--color-text-muted)'"
              />
              <div class="text-center">
                <p class="text-sm font-semibold" :style="{ color: values.type === 'INTERNAL' ? 'var(--color-primary)' : 'var(--color-text-primary)' }">Interno</p>
                <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Usuario del sistema</p>
              </div>
            </button>
          </div>

          <div v-if="values.type === 'INTERNAL'" class="space-y-3">
            <FormSelect
              v-bind="userIdBinds"
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
              v-bind="fullNameBinds"
              class="sm:col-span-2"
              label="Nombre completo"
              placeholder="Nombre o razón social"
              :error="errors.fullName"
              required
            />
            <FormInput
              v-bind="emailBinds"
              type="email"
              label="Email"
              placeholder="correo@ejemplo.com"
              :error="errors.email"
            />
            <FormInput
              v-bind="phoneBinds"
              type="tel"
              label="Teléfono"
              placeholder="Ej. 999 888 777"
            />
            <FormInput
              v-bind="documentNumberBinds"
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
              v-if="agent.isActive"
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
                  @click="showDeactivateConfirm = true"
                >
                  Desactivar
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

            <!-- Reactivar -->
            <div
              v-else
              class="flex items-start gap-3 p-4 rounded-xl"
              :style="{ backgroundColor: 'var(--color-success-light)', border: '1px solid var(--color-success)40' }"
            >
              <AppIcon icon="lucide:user-check" :size="20" color="var(--color-success)" class="shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Reactivar agente</p>
                <p class="text-xs mt-0.5 mb-3" :style="{ color: 'var(--color-text-muted)' }">
                  El agente volverá a mostrarse como activo en listados y búsquedas.
                </p>
                <button
                  v-if="!showActivateConfirm"
                  type="button"
                  class="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  :style="{ color: 'var(--color-success)', border: '1px solid var(--color-success)40', backgroundColor: 'var(--color-surface)' }"
                  @click="showActivateConfirm = true"
                >
                  Reactivar
                </button>
                <div v-else class="flex gap-2">
                  <button
                    type="button"
                    class="text-sm font-medium px-3 py-1.5 rounded-lg text-white transition-colors"
                    :style="{ backgroundColor: 'var(--color-success)' }"
                    :disabled="updateMutation.isPending.value"
                    @click="handleActivate"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    class="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    :style="{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-hover)' }"
                    @click="showActivateConfirm = false"
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
              :style="{ backgroundColor: values.isActive ? 'var(--color-primary)1a' : 'var(--color-surface-elevated)' }"
            >
              <AppIcon
                :icon="values.type === 'INTERNAL' ? 'lucide:user-check' : 'lucide:user-round-cog'"
                :size="22"
                :color="values.isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'"
              />
            </div>
            <div class="min-w-0">
              <p class="font-semibold truncate" :style="{ color: 'var(--color-text-primary)' }">
                {{ values.fullName || agent?.fullName || '—' }}
              </p>
              <div class="flex flex-wrap gap-1 mt-1">
                <Badge :variant="values.type === 'INTERNAL' ? 'info' : 'neutral'">
                  {{ values.type === 'INTERNAL' ? 'Interno' : 'Externo' }}
                </Badge>
                <Badge :variant="values.isActive ? 'success' : 'error'">
                  {{ values.isActive ? 'Activo' : 'Inactivo' }}
                </Badge>
              </div>
            </div>
          </div>

          <dl class="space-y-2.5 text-sm mb-6">
            <div v-if="values.email">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:mail" :size="13" />
                Email
              </dt>
              <dd class="truncate" :style="{ color: 'var(--color-text-primary)' }">{{ values.email }}</dd>
            </div>
            <div v-if="values.phone">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:phone" :size="13" />
                Teléfono
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ values.phone }}</dd>
            </div>
            <div v-if="values.documentNumber">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:id-card" :size="13" />
                Documento
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ values.documentNumber }}</dd>
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
