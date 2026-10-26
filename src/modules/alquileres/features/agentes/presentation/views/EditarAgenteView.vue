<script setup lang="ts">
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseAlert from '@shared/presentation/components/ui/BaseAlert.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { useAgent, useUpdateAgent, useDeleteAgent } from '../composables/useAgents'
import { navigateAfterAlquileresSave } from '../../../../presentation/navigation/navigateAfterAlquileresSave'
import { useUsers } from '@modules/settings/presentation/composables/useUsers'
import type { AgentType } from '../../domain/agent.types'
import OptionCardGroup from '@shared/presentation/components/forms/OptionCardGroup.vue'
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
  setFieldValue('fullName', u.fullName?.trim() || `${u.firstName} ${u.lastName}`.trim() || u.email)
  setFieldValue('email', u.email ?? '')
}

watch(
  agent,
  (a) => {
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
  },
  { immediate: true },
)

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
    await navigateAfterAlquileresSave(router, { listPath: '/alquileres/agentes' })
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
    await navigateAfterAlquileresSave(router, { listPath: '/alquileres/agentes' })
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
    await navigateAfterAlquileresSave(router, { listPath: '/alquileres/agentes' })
  } catch {
    void 0
  }
}

const handleDelete = async () => {
  showDeleteConfirm.value = false
  try {
    await deleteMutation.mutateAsync(id.value)
    await navigateAfterAlquileresSave(router, { listPath: '/alquileres/agentes' })
  } catch {
    void 0
  }
}
</script>

<template>
  <div >
    <!-- Header -->
    <PageHeader
      title="Editar Agente"
      :subtitle="agent?.fullName ?? 'Cargando...'"
      back
      @back="goBack"
      class="mb-6"
    />

    <!-- Loading -->
    <LoadingState v-if="loadingAgent" />

    <!-- Error -->
    <BaseAlert v-else-if="agentError || !agent" type="error">
      <span class="text-sm font-medium">No se encontró el agente o ocurrió un error.</span>
    </BaseAlert>

    <form v-else class="grid grid-cols-1 xl:grid-cols-3 gap-5" @submit.prevent="onSubmit">
      <!-- Columna principal -->
      <div class="xl:col-span-2 space-y-5">

        <FormSectionCard
          title="Tipo de agente"
          subtitle="Interno (sistema) o externo (tercero)"
          icon="lucide:user-cog"
        >
          <OptionCardGroup
            class="mb-4"
            :model-value="values.type"
            :options="[
              { value: 'EXTERNAL', label: 'Externo', description: 'Tercero / inmobiliaria', icon: 'lucide:user-round-cog' },
              { value: 'INTERNAL', label: 'Interno', description: 'Usuario del sistema', icon: 'lucide:user-check' },
            ]"
            @update:model-value="setFieldValue('type', $event as 'EXTERNAL' | 'INTERNAL')"
          />

          <div v-if="values.type === 'INTERNAL'" class="space-y-3">
            <FormSelect
              v-bind="userIdBinds"
              label="Seleccionar usuario del sistema"
              :options="userOptions"
              placeholder="Seleccionar usuario..."
              :error="errors.userId"
            />
            <BaseAlert v-if="selectedUser" type="info">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Datos del usuario:
                <strong class="text-gray-800 dark:text-white/90">{{ selectedUser.email }}</strong>
              </div>
            </BaseAlert>
          </div>
        </FormSectionCard>

        <FormSectionCard
          title="Datos del agente"
          subtitle="Nombre y datos de contacto"
          icon="lucide:id-card"
        >
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
        </FormSectionCard>

        <FormSectionCard
          title="Zona de peligro"
          subtitle="Acciones irreversibles sobre este agente"
          icon="lucide:alert-triangle"
          icon-color="var(--color-error)"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Desactivar -->
            <div
              v-if="agent.isActive"
              class="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
            >
              <AppIcon icon="lucide:user-x" :size="20" color="var(--color-warning, #f59e0b)" class="shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Desactivar agente</p>
                <p class="text-xs mt-0.5 mb-3 text-gray-400 dark:text-gray-500">
                  El agente dejará de aparecer en listados activos pero conservará su historial.
                </p>
                <BaseButton v-if="!showDeactivateConfirm" @click="showDeactivateConfirm = true" variant="secondary" size="sm" class="text-warning-600 dark:text-orange-400">Desactivar</BaseButton>
                <div v-else class="flex gap-2">
                  <BaseButton :disabled="updateMutation.isPending.value" @click="handleDeactivate" variant="danger" size="sm">Confirmar</BaseButton>
                  <BaseButton @click="showDeactivateConfirm = false" variant="secondary" size="sm">Cancelar</BaseButton>
                </div>
              </div>
            </div>

            <!-- Reactivar -->
            <div
              v-else
              class="flex items-start gap-3 p-4 rounded-xl bg-success-50 dark:bg-success-500/15 border border-success-500/25"
            >
              <AppIcon icon="lucide:user-check" :size="20" color="var(--color-success)" class="shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Reactivar agente</p>
                <p class="text-xs mt-0.5 mb-3 text-gray-400 dark:text-gray-500">
                  El agente volverá a mostrarse como activo en listados y búsquedas.
                </p>
                <BaseButton v-if="!showActivateConfirm" @click="showActivateConfirm = true" variant="secondary" size="sm">Reactivar</BaseButton>
                <div v-else class="flex gap-2">
                  <BaseButton :disabled="updateMutation.isPending.value" @click="handleActivate" size="sm">Confirmar</BaseButton>
                  <BaseButton @click="showActivateConfirm = false" variant="secondary" size="sm">Cancelar</BaseButton>
                </div>
              </div>
            </div>

            <!-- Eliminar (soft delete) -->
            <div
              class="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
            >
              <AppIcon icon="lucide:trash-2" :size="20" color="var(--color-error)" class="shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Eliminar agente</p>
                <p class="text-xs mt-0.5 mb-3 text-gray-400 dark:text-gray-500">
                  Soft delete: no se borra de la base de datos pero se oculta de todos los listados.
                </p>
                <BaseButton v-if="!showDeleteConfirm" @click="showDeleteConfirm = true" variant="danger" size="sm">Eliminar agente</BaseButton>
                <div v-else class="flex gap-2">
                  <BaseButton :disabled="deleteMutation.isPending.value" @click="handleDelete" variant="danger" size="sm">Confirmar</BaseButton>
                  <BaseButton @click="showDeleteConfirm = false" variant="secondary" size="sm">Cancelar</BaseButton>
                </div>
              </div>
            </div>
          </div>
        </FormSectionCard>

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
        <FormSectionCard
          title="Resumen del agente"
          dense
        >
          <div class="flex items-center gap-3 mb-4">
            <div :class="(values.isActive) ? 'bg-brand-500/10' : 'bg-gray-50 dark:bg-gray-800'"
              class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            >
              <AppIcon
                :icon="values.type === 'INTERNAL' ? 'lucide:user-check' : 'lucide:user-round-cog'"
                :size="22"
                :color="values.isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'"
              />
            </div>
            <div class="min-w-0">
              <p class="font-semibold truncate text-gray-800 dark:text-white/90">
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
              <dt class="flex items-center gap-1.5 font-medium mb-0.5 text-gray-400 dark:text-gray-500">
                <AppIcon icon="lucide:mail" :size="13" />
                Email
              </dt>
              <dd class="truncate text-gray-800 dark:text-white/90">{{ values.email }}</dd>
            </div>
            <div v-if="values.phone">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5 text-gray-400 dark:text-gray-500">
                <AppIcon icon="lucide:phone" :size="13" />
                Teléfono
              </dt>
              <dd class="text-gray-800 dark:text-white/90">{{ values.phone }}</dd>
            </div>
            <div v-if="values.documentNumber">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5 text-gray-400 dark:text-gray-500">
                <AppIcon icon="lucide:id-card" :size="13" />
                Documento
              </dt>
              <dd class="text-gray-800 dark:text-white/90">{{ values.documentNumber }}</dd>
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
        </FormSectionCard>
      </div>
    </form>
  </div>
</template>
