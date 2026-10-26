<script setup lang="ts">
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseAlert from '@shared/presentation/components/ui/BaseAlert.vue'
import { computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { useCreateAgent } from '../composables/useAgents'
import { navigateAfterAlquileresSave } from '../../../../presentation/navigation/navigateAfterAlquileresSave'
import { useUsers } from '@modules/settings/presentation/composables/useUsers'
import type { AgentType } from '../../domain/agent.types'
import OptionCardGroup from '@shared/presentation/components/forms/OptionCardGroup.vue'
const route = useRoute()
const router = useRouter()

/** Path para volver tras registrar (ej. distribución financiera de un contrato). */
const returnTo = computed(() => {
  const t = route.query.returnTo
  return typeof t === 'string' ? t : ''
})

/** Campo a autoseleccionar al volver: external | internal */
const agentField = computed(() => {
  const f = route.query.agentField
  return f === 'external' || f === 'internal' ? f : ''
})

const presetAgentType = computed((): AgentType | null => {
  const t = route.query.agentType
  return t === 'INTERNAL' || t === 'EXTERNAL' ? t : null
})

const schema = yup.object({
  type: yup.string().oneOf(['INTERNAL', 'EXTERNAL']).required(),
  userId: yup.string().trim().optional(),
  fullName: yup.string().required('El nombre es requerido').trim(),
  email: yup.string().trim().email('Email inválido').optional(),
  phone: yup.string().trim().optional(),
  documentTypeId: yup.string().trim().optional(),
  documentNumber: yup.string().trim().optional(),
})

const { values, handleSubmit, errors, defineComponentBinds, setFieldValue } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    type: 'EXTERNAL' as AgentType,
    userId: '',
    fullName: '',
    email: '',
    phone: '',
    documentTypeId: '',
    documentNumber: '',
  },
})

const userIdBinds = defineComponentBinds('userId')
const fullNameBinds = defineComponentBinds('fullName')
const emailBinds = defineComponentBinds('email')
const phoneBinds = defineComponentBinds('phone')
const documentNumberBinds = defineComponentBinds('documentNumber')

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
  () => values.type,
  (t) => {
    if (t === 'INTERNAL' && values.userId) fillFromUser(values.userId)
  },
)
watch(
  () => values.userId,
  (id) => {
    if (values.type === 'INTERNAL' && id) fillFromUser(id)
  },
)

onMounted(() => {
  if (presetAgentType.value) setFieldValue('type', presetAgentType.value)
})

const goBack = () => {
  if (returnTo.value) router.push(returnTo.value)
  else router.push('/alquileres/agentes')
}

const onSubmit = handleSubmit(async (formValues) => {
  try {
    const data = await createMutation.mutateAsync({
      applicationSlug: 'alquileres',
      type: formValues.type,
      userId: formValues.type === 'INTERNAL' && formValues.userId ? formValues.userId : null,
      fullName: formValues.fullName.trim(),
      email: formValues.email?.trim() || null,
      phone: formValues.phone?.trim() || null,
      documentTypeId: formValues.documentTypeId || null,
      documentNumber: formValues.documentNumber?.trim() || null,
    })
    await navigateAfterAlquileresSave(router, {
      listPath: '/alquileres/agentes',
      returnTo: returnTo.value && data?.id ? returnTo.value : undefined,
      returnQuery:
        returnTo.value && data?.id
          ? {
              selectedAgentId: data.id,
              ...(agentField.value ? { agentField: agentField.value } : {}),
            }
          : undefined,
      invalidate: () => createMutation.invalidateList(),
    })
  } catch {
    void 0
  }
})
</script>

<template>
  <div >
    <!-- Header -->
    <PageHeader
      title="Nuevo Agente"
      subtitle="Registrar agente interno o externo"
      back
      @back="goBack"
      class="mb-6"
    />

    <form class="grid grid-cols-1 xl:grid-cols-3 gap-5" @submit.prevent="onSubmit">
      <!-- Columna principal -->
      <div class="xl:col-span-2 space-y-5">

        <FormSectionCard
          title="Tipo de agente"
          subtitle="¿Es un usuario del sistema o un tercero?"
          icon="lucide:user-cog"
        >
          <BaseAlert v-if="presetAgentType" type="info" class="mb-4">
            <span class="text-gray-500 dark:text-gray-400">
              Registrando agente
              <strong class="text-gray-800 dark:text-white/90">{{ presetAgentType === 'INTERNAL' ? 'interno' : 'externo' }}</strong>
            </span>
          </BaseAlert>

          <!-- Selector de tipo como botones -->
          <OptionCardGroup
            v-if="!presetAgentType"
            class="mb-4"
            :model-value="values.type"
            :options="[
              { value: 'EXTERNAL', label: 'Externo', description: 'Tercero / inmobiliaria', icon: 'lucide:user-round-cog' },
              { value: 'INTERNAL', label: 'Interno', description: 'Usuario del sistema', icon: 'lucide:user-check' },
            ]"
            @update:model-value="setFieldValue('type', $event as 'EXTERNAL' | 'INTERNAL')"
          />

          <!-- Si es interno: selector de usuario -->
          <div v-if="values.type === 'INTERNAL'" class="space-y-3">
            <FormSelect
              v-bind="userIdBinds"
              label="Vincular usuario del sistema (opcional)"
              :options="[{ value: '', label: 'Ninguno' }, ...userOptions]"
              placeholder="Seleccionar usuario..."
              :error="errors.userId"
            />
            <BaseAlert v-if="selectedUser" type="info">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Datos completados desde:
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
        <FormSectionCard
          title="Resumen del agente"
          dense
        >
          <div class="flex items-center gap-3 mb-4">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-brand-500/10"
            >
              <AppIcon
                :icon="values.type === 'INTERNAL' ? 'lucide:user-check' : 'lucide:user-round-cog'"
                :size="22"
                color="var(--color-primary)"
              />
            </div>
            <div class="min-w-0">
              <p class="font-semibold truncate text-gray-800 dark:text-white/90">
                {{ values.fullName || 'Sin nombre' }}
              </p>
              <Badge :variant="values.type === 'INTERNAL' ? 'info' : 'neutral'" class="mt-1">
                {{ values.type === 'INTERNAL' ? 'Interno' : 'Externo' }}
              </Badge>
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
        </FormSectionCard>
      </div>
    </form>
  </div>
</template>
