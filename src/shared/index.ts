/**
 * Shared Module Exports
 * Central export point for all shared functionality
 *
 * Alertas: `import { markapAlert } from '@/shared/composables'`.
 * Formularios (VeeValidate + componentes): `import { useForm, FormInput } from '@/shared/components/forms'` o desde `@/shared` (vía `./components`).
 * Tipos compartidos (API, menú, helpers, rol/aplicación): `import { … } from '@/shared/domain'`.
 */

export * from './components'
export * from './composables'
export * from './domain'
export * from './utils'
