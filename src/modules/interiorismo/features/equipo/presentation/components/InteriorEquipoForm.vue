<script setup lang="ts">
import { computed, watch } from 'vue'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import OptionCardGroup from '@shared/presentation/components/forms/OptionCardGroup.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { useDocumentTypes } from '../../../clientes/presentation/composables/useClients'
import { TEAM_ROLES, type TeamMember, type TeamMemberFormPayload, type TeamMemberType, type TeamRole } from '../../domain/team.types'
import { TEAM_MEMBER_TYPE_LABELS, TEAM_ROLE_LABELS } from '../labels'
/**
 * InteriorEquipoForm — alta/edición de un integrante del equipo de Interiorismo.
 * Es un registro informativo para asignar responsables en los proyectos: no crea
 * usuario ni da acceso al sistema. Slot `extra`: secciones propias de la vista (estado en edición).
 * `variant="modal"`: una columna sin botones propios; el modal los pone en su pie fijo
 * y envía el formulario con `form="<formId>"`.
 */

interface Props {
  /** Integrante a editar; sin él, el formulario arranca vacío (alta) */
  initial?: TeamMember | null
  submitLabel: string
  submitting?: boolean
  canWrite?: boolean
  variant?: 'page' | 'modal'
  /** id del `<form>`, para enviarlo desde un botón externo (pie del modal) */
  formId?: string
}

const props = withDefaults(defineProps<Props>(), {
  initial: null,
  submitting: false,
  canWrite: true,
  variant: 'page',
  formId: undefined,
})

const isModal = computed(() => props.variant === 'modal')

const emit = defineEmits<{
  submit: [payload: TeamMemberFormPayload]
  cancel: []
}>()

/** Documentos numéricos: se fuerza teclado numérico y solo dígitos */
const NUMERIC_DOCUMENT_CODES = ['DNI', 'RUC']

const { data: documentTypes, isLoading: loadingDocs } = useDocumentTypes()
function findDocumentType(id: string | undefined) {
  return (documentTypes.value ?? []).find((d) => d.id === id)
}

const schema = yup.object({
  type: yup.string().oneOf(['INTERNAL', 'EXTERNAL']).required(),
  roles: yup.array(yup.string().oneOf([...TEAM_ROLES]).required()).min(1, 'Marque al menos una función').required(),
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

const { values, handleSubmit, errors, submitCount, defineComponentBinds, setFieldValue, resetForm } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    type: 'INTERNAL' as TeamMemberType,
    roles: [] as TeamRole[],
    fullName: '',
    email: '',
    phone: '',
    documentTypeId: '',
    documentNumber: '',
  },
})

const fullNameBinds = defineComponentBinds('fullName')
const emailBinds = defineComponentBinds('email')
const phoneBinds = defineComponentBinds('phone')
const documentTypeIdBinds = defineComponentBinds('documentTypeId')
const documentNumberBinds = defineComponentBinds('documentNumber')

const selectedRoles = computed(() => (values.roles ?? []) as TeamRole[])
function toggleRole(role: TeamRole, checked: boolean) {
  const next = checked ? [...selectedRoles.value, role] : selectedRoles.value.filter((r) => r !== role)
  setFieldValue('roles', TEAM_ROLES.filter((r) => next.includes(r)))
}

const selectedDocumentType = computed(() => findDocumentType(values.documentTypeId))
const documentNumberHint = computed(() => {
  const doc = selectedDocumentType.value
  return doc?.length
    ? `${doc.length} ${NUMERIC_DOCUMENT_CODES.includes(doc.code) ? 'dígitos' : 'caracteres'}`
    : undefined
})
const documentTypeOptions = computed(() =>
  (documentTypes.value ?? []).map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
)

const typeCards = [
  { value: 'INTERNAL', label: TEAM_MEMBER_TYPE_LABELS.INTERNAL, description: 'Trabaja en la empresa', icon: 'lucide:user-check' },
  { value: 'EXTERNAL', label: TEAM_MEMBER_TYPE_LABELS.EXTERNAL, description: 'Freelance o tercero', icon: 'lucide:user-round-cog' },
]

watch(
  () => props.initial,
  (m) => {
    if (!m) return
    resetForm({
      values: {
        type: m.type,
        roles: [...m.roles],
        fullName: m.fullName ?? '',
        email: m.email ?? '',
        phone: m.phone ?? '',
        documentTypeId: m.documentTypeId ?? '',
        documentNumber: m.documentNumber ?? '',
      },
    })
  },
  { immediate: true },
)

const onSubmit = handleSubmit((v) => {
  emit('submit', {
    type: v.type as TeamMemberType,
    roles: v.roles as TeamRole[],
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
    <div :class="isModal ? 'space-y-5' : 'space-y-6 xl:col-span-2'">
      <FormSectionCard title="Funciones" subtitle="En qué puestos puede asignarse dentro de un proyecto">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormCheckbox
            v-for="role in TEAM_ROLES"
            :key="role"
            :model-value="selectedRoles.includes(role)"
            :label="TEAM_ROLE_LABELS[role]"
            :disabled="!canWrite"
            @update:model-value="toggleRole(role, $event)"
          />
        </div>
        <!-- El aviso de funciones espera al primer intento de guardar (setFieldValue valida al instante) -->
        <p v-if="errors.roles && submitCount > 0" class="mt-3 text-xs text-error-600 dark:text-error-500">{{ errors.roles }}</p>
      </FormSectionCard>

      <FormSectionCard title="Vínculo" subtitle="Relación con la empresa">
        <OptionCardGroup
          :model-value="values.type"
          :options="typeCards"
          :disabled="!canWrite"
          @update:model-value="setFieldValue('type', $event as TeamMemberType)"
        />
      </FormSectionCard>

      <FormSectionCard title="Datos personales" subtitle="Identificación y contacto">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <FormInput
            v-bind="fullNameBinds"
            class="md:col-span-4"
            label="Nombre completo"
            placeholder="Ana Torres Quispe"
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

    <aside v-if="!isModal" class="space-y-6 xl:sticky xl:top-24">
      <FormSectionCard title="Resumen">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500/10">
            <AppIcon icon="lucide:hard-hat" :size="22" color="var(--color-primary)" />
          </div>
          <div class="min-w-0">
            <p class="truncate font-semibold text-gray-800 dark:text-white/90">
              {{ values.fullName || 'Sin nombre' }}
            </p>
            <div class="mt-1 flex flex-wrap gap-1">
              <Badge variant="neutral">{{ TEAM_MEMBER_TYPE_LABELS[values.type as TeamMemberType] }}</Badge>
              <Badge v-if="initial" :variant="initial.isActive ? 'success' : 'error'">
                {{ initial.isActive ? 'Activo' : 'Inactivo' }}
              </Badge>
            </div>
          </div>
        </div>
        <div v-if="selectedRoles.length" class="mt-4 flex flex-wrap gap-1">
          <Badge v-for="role in selectedRoles" :key="role" variant="info">{{ TEAM_ROLE_LABELS[role] }}</Badge>
        </div>
        <p class="mt-4 flex items-start gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
          <AppIcon icon="lucide:info" :size="14" class="mt-0.5 shrink-0" />
          Registro informativo: el integrante no tiene usuario ni acceso al sistema.
        </p>
      </FormSectionCard>

      <div class="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
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
        <BaseButton variant="outline" type="button" block @click="emit('cancel')">Cancelar</BaseButton>
        <p class="text-center text-theme-xs text-gray-400 dark:text-gray-500">
          Los campos con <span class="text-error-500">*</span> son obligatorios
        </p>
      </div>
    </aside>
  </form>
</template>
