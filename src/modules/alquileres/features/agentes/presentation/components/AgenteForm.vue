<script setup lang="ts">
import { computed, watch } from 'vue'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseAlert from '@shared/presentation/components/ui/BaseAlert.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import OptionCardGroup from '@shared/presentation/components/forms/OptionCardGroup.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { useAuthStore } from '@modules/auth/presentation/stores/auth.store'
import { useUsers } from '@modules/settings/presentation/composables/useUsers'
import { useDocumentTypes } from '../../../clientes/presentation/composables/useClients'
import type { AgentFormPayload, AgentListItem, AgentType } from '../../domain/agent.types'
/**
 * AgenteForm — formulario único de alta/edición de agentes (lo usan Alquileres y Ventas).
 * Interno: puede vincularse a un usuario del sistema (solo admins pueden listar usuarios).
 * Externo: tercero o inmobiliaria. Slot `extra`: secciones propias de la vista (ej. estado en edición).
 * `variant="modal"`: una columna sin botones propios; el modal los pone en su pie fijo
 * y envía el formulario con `form="<formId>"`.
 */

interface Props {
  /** Agente a editar; sin él, el formulario arranca vacío (alta) */
  initial?: AgentListItem | null
  /** Tipo fijado desde el origen (ej. distribución financiera pide un agente interno) */
  presetType?: AgentType | null
  submitLabel: string
  submitting?: boolean
  canWrite?: boolean
  variant?: 'page' | 'modal'
  /** id del `<form>`, para enviarlo desde un botón externo (pie del modal) */
  formId?: string
}

const props = withDefaults(defineProps<Props>(), {
  initial: null,
  presetType: null,
  submitting: false,
  canWrite: true,
  variant: 'page',
  formId: undefined,
})

const isModal = computed(() => props.variant === 'modal')

const emit = defineEmits<{
  submit: [payload: AgentFormPayload]
  cancel: []
}>()

/** Documentos numéricos: se fuerza teclado numérico y solo dígitos */
const NUMERIC_DOCUMENT_CODES = ['DNI', 'RUC']

const authStore = useAuthStore()
// `/users` es solo para administradores: el resto registra el agente sin vincular usuario
const usersQuery = authStore.isAdmin ? useUsers() : null
const usersList = computed(() => usersQuery?.data.value ?? [])

const { data: documentTypes, isLoading: loadingDocs } = useDocumentTypes()
function findDocumentType(id: string | undefined) {
  return (documentTypes.value ?? []).find((d) => d.id === id)
}

const schema = yup.object({
  type: yup.string().oneOf(['INTERNAL', 'EXTERNAL']).required(),
  userId: yup.string().trim(),
  fullName: yup.string().required('El nombre es requerido').trim(),
  email: yup
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .email('Email inválido')
    .optional(),
  phone: yup.string().trim(),
  documentTypeId: yup.string().trim(),
  documentNumber: yup
    .string()
    .trim()
    .test('document-format', '', function (value) {
      const doc = findDocumentType(this.parent.documentTypeId as string | undefined)
      if (!value) return true
      if (!doc) return this.createError({ message: 'Seleccione el tipo de documento' })
      if (NUMERIC_DOCUMENT_CODES.includes(doc.code) && !/^\d+$/.test(value)) {
        return this.createError({ message: `El ${doc.code} solo admite dígitos` })
      }
      if (doc.length && value.length !== doc.length) {
        return this.createError({ message: `El ${doc.code} debe tener ${doc.length} caracteres` })
      }
      return true
    }),
})

const { values, handleSubmit, errors, defineComponentBinds, setFieldValue, resetForm } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    type: (props.presetType ?? 'EXTERNAL') as AgentType,
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
const documentTypeIdBinds = defineComponentBinds('documentTypeId')
const documentNumberBinds = defineComponentBinds('documentNumber')

const isInternal = computed(() => values.type === 'INTERNAL')
const selectedDocumentType = computed(() => findDocumentType(values.documentTypeId))
const isCompany = computed(() => selectedDocumentType.value?.code === 'RUC')
const documentNumberHint = computed(() => {
  const doc = selectedDocumentType.value
  return doc?.length
    ? `${doc.length} ${NUMERIC_DOCUMENT_CODES.includes(doc.code) ? 'dígitos' : 'caracteres'}`
    : undefined
})

const userOptions = computed(() =>
  usersList.value.map((u) => ({
    value: u.id,
    label: `${u.firstName} ${u.lastName}`.trim() || u.email,
  })),
)
const documentTypeOptions = computed(() =>
  (documentTypes.value ?? []).map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
)
const selectedUser = computed(() =>
  isInternal.value && values.userId ? usersList.value.find((u) => u.id === values.userId) : undefined,
)

/** Al vincular un usuario, completa nombre y email desde su ficha */
function fillFromUser(userId: string) {
  const u = usersList.value.find((x) => x.id === userId)
  if (!u) return
  setFieldValue('fullName', u.fullName?.trim() || `${u.firstName} ${u.lastName}`.trim() || u.email)
  setFieldValue('email', u.email ?? '')
}

watch(
  () => [values.type, values.userId] as const,
  ([type, userId], prev) => {
    if (!prev) return
    if (type === 'INTERNAL' && userId && userId !== prev[1]) fillFromUser(userId)
  },
)

/**
 * Agentes antiguos guardaban el número sin tipo de documento: se deduce por longitud
 * (8 dígitos → DNI, 11 → RUC) para no bloquear su edición.
 */
function inferDocumentTypeId(number: string | null): string {
  if (!number || !/^\d+$/.test(number)) return ''
  return (
    (documentTypes.value ?? []).find(
      (d) => NUMERIC_DOCUMENT_CODES.includes(d.code) && d.length === number.length,
    )?.id ?? ''
  )
}

// Carga única por agente, cuando ya están los tipos de documento (para la deducción)
let loadedAgentId: string | null = null
watch(
  [() => props.initial, documentTypes],
  ([a, docs]) => {
    if (!a || !docs || loadedAgentId === a.id) return
    loadedAgentId = a.id
    resetForm({
      values: {
        type: a.type,
        userId: a.userId ?? '',
        fullName: a.fullName ?? '',
        email: a.email ?? '',
        phone: a.phone ?? '',
        documentTypeId: a.documentTypeId || inferDocumentTypeId(a.documentNumber),
        documentNumber: a.documentNumber ?? '',
      },
    })
  },
  { immediate: true },
)

const onSubmit = handleSubmit((v) => {
  emit('submit', {
    type: v.type as AgentType,
    userId: v.type === 'INTERNAL' && v.userId ? v.userId : null,
    fullName: v.fullName.trim(),
    email: v.email?.trim() || null,
    phone: v.phone?.trim() || null,
    documentTypeId: v.documentTypeId || null,
    documentNumber: v.documentNumber?.trim() || null,
  })
})
</script>

<template>
  <LoadingState v-if="loadingDocs" class="py-12" />

  <form
    v-else
    :id="formId"
    :class="isModal ? 'space-y-5' : 'grid grid-cols-1 items-start gap-6 xl:grid-cols-3'"
    novalidate
    @submit.prevent="onSubmit"
  >
    <!-- ── Columna principal ── -->
    <div :class="isModal ? 'space-y-5' : 'space-y-6 xl:col-span-2'">
      <FormSectionCard title="Tipo de agente" subtitle="Usuario del sistema o tercero">
        <BaseAlert v-if="presetType" type="info">
          Registrando un agente
          <strong>{{ presetType === 'INTERNAL' ? 'interno' : 'externo' }}</strong>
        </BaseAlert>
        <OptionCardGroup
          v-else
          :model-value="values.type"
          :options="[
            { value: 'EXTERNAL', label: 'Externo', description: 'Tercero o inmobiliaria', icon: 'lucide:user-round-cog' },
            { value: 'INTERNAL', label: 'Interno', description: 'Personal de la empresa', icon: 'lucide:user-check' },
          ]"
          @update:model-value="setFieldValue('type', $event as AgentType)"
        />

        <template v-if="isInternal">
          <FormSelect
            v-if="usersQuery"
            v-bind="userIdBinds"
            class="mt-5"
            label="Usuario del sistema"
            :options="[{ value: '', label: 'Sin vincular' }, ...userOptions]"
            placeholder="Seleccionar usuario..."
            :loading="usersQuery.isLoading.value"
            :error="errors.userId"
          />
          <p v-if="usersQuery && !selectedUser" class="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
            Opcional: al vincularlo se completan el nombre y el email desde su cuenta.
          </p>
          <p v-else class="mt-4 flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
            <AppIcon icon="lucide:info" :size="14" />
            Solo un administrador puede vincular el agente a un usuario del sistema.
          </p>
          <p v-if="selectedUser" class="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
            Datos completados desde <strong>{{ selectedUser.email }}</strong>
          </p>
        </template>
      </FormSectionCard>

      <FormSectionCard title="Datos del agente" subtitle="Identificación y contacto">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <FormInput
            v-bind="fullNameBinds"
            class="md:col-span-4"
            :label="isCompany ? 'Razón social' : 'Nombre completo'"
            :placeholder="isCompany ? 'Inmobiliaria S.A.C.' : 'Juan Pérez García'"
            :error="errors.fullName"
            required
          />
          <FormSelect
            v-bind="documentTypeIdBinds"
            class="md:col-span-2"
            label="Tipo de documento"
            :options="[{ value: '', label: 'Sin documento' }, ...documentTypeOptions]"
            placeholder="Seleccionar"
            :error="errors.documentTypeId"
          />
          <FormInput
            v-bind="documentNumberBinds"
            class="md:col-span-2"
            label="N.º de documento"
            :placeholder="selectedDocumentType?.length ? '0'.repeat(selectedDocumentType.length) : 'Número'"
            :maxlength="selectedDocumentType?.length ?? undefined"
            :inputmode="selectedDocumentType && NUMERIC_DOCUMENT_CODES.includes(selectedDocumentType.code) ? 'numeric' : 'text'"
            :disabled="!values.documentTypeId && !values.documentNumber"
            :hint="documentNumberHint"
            :error="errors.documentNumber"
          />
          <FormInput
            v-bind="emailBinds"
            class="md:col-span-2"
            type="email"
            label="Email"
            placeholder="correo@ejemplo.com"
            :error="errors.email"
          />
          <FormInput
            v-bind="phoneBinds"
            class="md:col-span-2"
            type="tel"
            label="Teléfono"
            placeholder="999 888 777"
            :error="errors.phone"
          />
        </div>
      </FormSectionCard>

      <slot name="extra" />
    </div>

    <!-- ── Lateral: resumen + acciones (fijo en escritorio; no aplica en modal) ── -->
    <aside v-if="!isModal" class="space-y-6 xl:sticky xl:top-24">
      <FormSectionCard title="Resumen">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500/10">
            <AppIcon
              :icon="isInternal ? 'lucide:user-check' : 'lucide:user-round-cog'"
              :size="22"
              color="var(--color-primary)"
            />
          </div>
          <div class="min-w-0">
            <p class="truncate font-semibold text-gray-800 dark:text-white/90">
              {{ values.fullName || 'Sin nombre' }}
            </p>
            <div class="mt-1 flex flex-wrap gap-1">
              <Badge :variant="isInternal ? 'info' : 'neutral'">
                {{ isInternal ? 'Interno' : 'Externo' }}
              </Badge>
              <Badge v-if="initial" :variant="initial.isActive ? 'success' : 'error'">
                {{ initial.isActive ? 'Activo' : 'Inactivo' }}
              </Badge>
            </div>
          </div>
        </div>
        <dl v-if="values.email || values.phone || values.documentNumber" class="mt-4 space-y-2 text-sm">
          <div v-if="values.documentNumber">
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Documento</dt>
            <dd class="text-gray-800 dark:text-white/90">
              {{ selectedDocumentType?.code ?? '' }} {{ values.documentNumber }}
            </dd>
          </div>
          <div v-if="values.email">
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Email</dt>
            <dd class="truncate text-gray-800 dark:text-white/90">{{ values.email }}</dd>
          </div>
          <div v-if="values.phone">
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Teléfono</dt>
            <dd class="text-gray-800 dark:text-white/90">{{ values.phone }}</dd>
          </div>
        </dl>
      </FormSectionCard>

      <div
        class="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3"
      >
        <BaseButton
          v-if="canWrite"
          type="submit"
          variant="primary"
          icon="lucide:save"
          block
          :loading="submitting"
          loading-text="Guardando..."
        >
          {{ submitLabel }}
        </BaseButton>
        <BaseButton variant="outline" type="button" block @click="emit('cancel')">
          Cancelar
        </BaseButton>
        <p class="text-center text-theme-xs text-gray-400 dark:text-gray-500">
          Los campos con <span class="text-error-500">*</span> son obligatorios
        </p>
      </div>
    </aside>
  </form>
</template>
