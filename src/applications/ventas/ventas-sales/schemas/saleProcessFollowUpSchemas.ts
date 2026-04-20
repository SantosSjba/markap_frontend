import * as yup from 'yup'

export const saleProcessNoteFormSchema = yup.object({
  text: yup.string().required('La nota es obligatoria').trim(),
})

export const saleProcessActivityFormSchema = yup.object({
  activityType: yup.string().required('Seleccione el tipo'),
  title: yup.string().required('Indique un título').trim(),
  description: yup
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .optional(),
})

export const saleProcessReminderFormSchema = yup.object({
  title: yup.string().required('Indique un título').trim(),
  dueAt: yup
    .string()
    .required('Seleccione fecha y hora')
    .test('valid-datetime', 'Fecha u hora no válida', (v) => {
      if (!v) return false
      const d = new Date(v)
      return !Number.isNaN(d.getTime())
    }),
})
