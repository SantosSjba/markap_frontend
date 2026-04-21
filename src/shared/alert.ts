/**
 * Modales SweetAlert2 con tema MARKAP; toasts con estilo por defecto de la librería.
 *
 * @example
 * import { markapAlert } from '@/shared/alert'
 *
 * // Modal: texto del cuerpo primero, título opcional después
 * void markapAlert.success('Operación correcta.', 'Listo')
 * void markapAlert.error('No se pudo guardar.', 'Error')
 * void markapAlert.fire({ icon: 'success', title: 'Título', text: 'Cuerpo', confirmButtonText: 'Entendido' })
 *
 * // Toast: título primero, texto opcional después
 * void markapAlert.toast.success('Guardado', 'Los cambios ya están aplicados.')
 * void markapAlert.toast.fire({ icon: 'info', title: 'Hola', text: 'Detalle' })
 */
export { markapAlert, markapSwalFire, useMarkapAlert } from './composables/useMarkapAlert'

export type {
  MarkapAlertVariant,
  MarkapConfirmOptions,
  MarkapDangerConfirmOptions,
  MarkapPromptSelectOptions,
  MarkapPromptTextareaOptions,
  MarkapPromptTextOptions,
  MarkapThreeChoiceOptions,
  MarkapThreeChoiceResult,
  MarkapToastDefaults,
  SweetAlertIcon,
  SweetAlertOptions,
  SweetAlertResult,
} from './composables/useMarkapAlert'
