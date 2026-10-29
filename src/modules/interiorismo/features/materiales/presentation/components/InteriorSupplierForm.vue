<script setup lang="ts">
import { computed, watch } from 'vue'
import * as yup from 'yup'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import type {
  CreateInteriorMaterialSupplierPayload,
  InteriorSupplierDetail,
} from '../../domain/suppliers.types'
/** InteriorSupplierForm — alta y edición de proveedores (empresa con RUC y contacto). */

const props = withDefaults(
  defineProps<{
    initial?: InteriorSupplierDetail | null
    submitLabel: string
    submitting?: boolean
    canWrite?: boolean
    variant?: 'page' | 'modal'
    formId?: string
  }>(),
  { initial: null, submitting: false, canWrite: true, variant: 'page', formId: undefined },
)
const emit = defineEmits<{ submit: [payload: CreateInteriorMaterialSupplierPayload]; cancel: [] }>()
const isModal = computed(() => props.variant === 'modal')

const optionalEmail = yup
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .email('Email inválido')
  .optional()

const schema = yup.object({
  companyName: yup.string().trim().required('Ingrese la razón social').max(200),
  ruc: yup
    .string()
    .trim()
    .required('Ingrese el RUC')
    .matches(/^\d{11}$/, 'El RUC debe tener 11 dígitos'),
  contactName: yup.string().trim().max(120),
  phone: yup.string().trim().max(40),
  email: optionalEmail,
})

const { handleSubmit, errors, resetForm, defineComponentBinds } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: { companyName: '', ruc: '', contactName: '', phone: '', email: '' },
})
const b = defineComponentBinds
const companyB = b('companyName')
const rucB = b('ruc')
const contactB = b('contactName')
const phoneB = b('phone')
const emailB = b('email')

watch(
  () => props.initial,
  (s) => {
    if (!s) return
    resetForm({
      values: { companyName: s.companyName, ruc: s.ruc, contactName: s.contactName ?? '', phone: s.phone ?? '', email: s.email ?? '' },
    })
  },
  { immediate: true },
)

const onSubmit = handleSubmit((v) =>
  emit('submit', {
    companyName: v.companyName.trim(),
    ruc: v.ruc.trim(),
    contactName: v.contactName?.trim() || null,
    phone: v.phone?.trim() || null,
    email: v.email?.trim() || null,
  }),
)
</script>

<template>
  <form :id="formId" :class="isModal ? 'space-y-5' : 'grid grid-cols-1 items-start gap-6 xl:grid-cols-3'" novalidate @submit.prevent="onSubmit">
    <div :class="isModal ? '' : 'xl:col-span-2'">
      <FormSectionCard title="Proveedor" subtitle="Empresa y persona de contacto">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput v-bind="companyB" class="md:col-span-2" label="Razón social" placeholder="Maderas del Sur S.A.C." :error="errors.companyName" required />
          <FormInput v-bind="rucB" label="RUC" placeholder="20123456789" inputmode="numeric" :maxlength="11" :error="errors.ruc" required />
          <FormInput v-bind="contactB" label="Contacto" placeholder="Nombre del vendedor" :error="errors.contactName" />
          <FormInput v-bind="phoneB" type="tel" label="Teléfono" placeholder="999 888 777" :error="errors.phone" />
          <FormInput v-bind="emailB" type="email" label="Email" placeholder="ventas@proveedor.com" :error="errors.email" />
        </div>
      </FormSectionCard>
    </div>
    <aside v-if="!isModal" class="xl:sticky xl:top-24">
      <div class="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <BaseButton v-if="canWrite" type="submit" variant="primary" icon="lucide:save" block :loading="submitting" loading-text="Guardando...">{{ submitLabel }}</BaseButton>
        <BaseButton variant="outline" type="button" block @click="emit('cancel')">Cancelar</BaseButton>
      </div>
    </aside>
  </form>
</template>
