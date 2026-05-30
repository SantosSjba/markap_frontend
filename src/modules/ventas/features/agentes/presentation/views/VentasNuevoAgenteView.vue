<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, AppIcon, Badge, FormSectionCard } from '@shared/components'
import { FormInput, FormSelect } from '@shared/components'
import { useForm, toTypedSchema } from '@shared/components/forms'
import { markapAlert } from '@/shared/composables'
import { useVentasCreateAgent } from '../../application/useAgents'
import { useUsers } from '@modules/settings'
import type { VentasAgentType } from '../../domain/agent.types'
import { ventasAgentCreateFormSchema } from '../../infrastructure/schemas/agentFormSchema'
import { navigateAfterVentasSave } from '@modules/ventas/application/navigateAfterVentasSave'

const route = useRoute()
const router = useRouter()

const returnTo = computed(() => {
  const t = route.query.returnTo
  return typeof t === 'string' ? t : ''
})

const agentField = computed(() => {
  const f = route.query.agentField
  return f === 'external' || f === 'internal' ? f : ''
})

const presetAgentType = computed((): VentasAgentType | null => {
  const t = route.query.agentType
  return t === 'INTERNAL' || t === 'EXTERNAL' ? t : null
})

const { values, handleSubmit, errors, defineComponentBinds, setFieldValue, resetForm } = useForm({
  validationSchema: toTypedSchema(ventasAgentCreateFormSchema),
  initialValues: {
    type: 'EXTERNAL' as VentasAgentType,
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
const createMutation = useVentasCreateAgent()

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
  else router.push('/ventas/agentes')
}

function onInvalidSubmit() {
  void markapAlert.toast.warning(
    'Revisa el formulario',
    'Corrige los campos marcados antes de guardar.',
  )
}

const onSubmit = handleSubmit(
  async (formValues) => {
    try {
      const data = await createMutation.mutateAsync({
        type: formValues.type,
        userId: formValues.type === 'INTERNAL' && formValues.userId ? formValues.userId : null,
        fullName: formValues.fullName.trim(),
        email: formValues.email?.trim() || null,
        phone: formValues.phone?.trim() || null,
        documentTypeId: formValues.documentTypeId || null,
        documentNumber: formValues.documentNumber?.trim() || null,
      })
      resetForm()
      await navigateAfterVentasSave(router, {
        listPath: '/ventas/agentes',
        returnTo: returnTo.value || undefined,
        returnQuery:
          returnTo.value && data?.id
            ? {
                selectedAgentId: data.id,
                ...(agentField.value ? { agentField: agentField.value } : {}),
              }
            : undefined,
      })
    } catch {
      void 0
    }
  },
  onInvalidSubmit,
)
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto">
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
          Registrar agente de ventas (interno o externo)
        </p>
      </div>
    </div>

    <form class="grid grid-cols-1 xl:grid-cols-3 gap-5" @submit.prevent="onSubmit">
      <div class="xl:col-span-2 space-y-5">
        <FormSectionCard
          title="Tipo de agente"
          subtitle="¿Es un usuario del sistema o un tercero?"
          icon="lucide:user-cog"
        >
          <div
            v-if="presetAgentType"
            class="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            :style="{ backgroundColor: 'var(--color-primary)0d', border: '1px solid var(--color-primary)33' }"
          >
            <AppIcon icon="lucide:info" :size="15" color="var(--color-primary)" />
            <span :style="{ color: 'var(--color-text-secondary)' }">
              Registrando agente
              <strong :style="{ color: 'var(--color-text-primary)' }">{{ presetAgentType === 'INTERNAL' ? 'interno' : 'externo' }}</strong>
            </span>
          </div>

          <div v-if="!presetAgentType" class="grid grid-cols-2 gap-3 mb-4">
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
              label="Vincular usuario del sistema (opcional)"
              :options="[{ value: '', label: 'Ninguno' }, ...userOptions]"
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
                :icon="values.type === 'INTERNAL' ? 'lucide:user-check' : 'lucide:user-round-cog'"
                :size="22"
                color="var(--color-primary)"
              />
            </div>
            <div class="min-w-0">
              <p class="font-semibold truncate" :style="{ color: 'var(--color-text-primary)' }">
                {{ values.fullName || 'Sin nombre' }}
              </p>
              <Badge :variant="values.type === 'INTERNAL' ? 'info' : 'neutral'" class="mt-1">
                {{ values.type === 'INTERNAL' ? 'Interno' : 'Externo' }}
              </Badge>
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
