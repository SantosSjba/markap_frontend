/**
 * Form Components Exports
 *
 * Inputs de texto/número/fecha: solo `FormInput` (antes existía `BaseInput` en ui/, duplicado).
 * VeeValidate + Yup: reexportados aquí para un solo punto de entrada (`@shared/components/forms`).
 */

export { useForm, Field, ErrorMessage, Form } from 'vee-validate'
export { toTypedSchema } from '@vee-validate/yup'

export { default as FormInput } from './FormInput.vue'
export { default as FormSelect } from './FormSelect.vue'
export { default as FormTextarea } from './FormTextarea.vue'
export { default as FormCheckbox } from './FormCheckbox.vue'
export { default as SearchInput } from './SearchInput.vue'
export { default as FileDropzone } from './FileDropzone.vue'
export { default as FormSectionCard } from './FormSectionCard.vue'
