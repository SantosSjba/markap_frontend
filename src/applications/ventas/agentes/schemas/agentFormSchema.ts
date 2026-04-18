import * as yup from 'yup'

const optionalTrim = () =>
  yup
    .string()
    .trim()
    .transform((v) => (v === '' || v == null ? undefined : v))
    .optional()

/**
 * Esquema Yup compartido para formularios de agentes (ventas), usado con VeeValidate (`toTypedSchema`).
 */
export const ventasAgentCreateFormSchema = yup.object({
  type: yup
    .string()
    .oneOf(['INTERNAL', 'EXTERNAL'] as const)
    .required('Seleccione el tipo de agente'),
  userId: yup.string().when('type', {
    is: 'INTERNAL',
    then: (s) => s.required('Seleccione el usuario'),
    otherwise: (s) => s.optional(),
  }),
  fullName: yup
    .string()
    .required('El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .trim(),
  email: yup
    .string()
    .trim()
    .transform((v) => (v === '' || v == null ? undefined : v))
    .email('Email inválido')
    .optional(),
  phone: yup
    .string()
    .trim()
    .transform((v) => (v === '' || v == null ? undefined : v))
    .optional()
    .test(
      'phone-digits',
      'El teléfono debe tener al menos 6 dígitos',
      (v) => !v || v.replace(/\D/g, '').length >= 6,
    ),
  documentTypeId: optionalTrim(),
  documentNumber: optionalTrim(),
})

export const ventasAgentEditFormSchema = ventasAgentCreateFormSchema.shape({
  isActive: yup.boolean().required(),
})
