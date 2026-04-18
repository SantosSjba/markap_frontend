/**
 * Usar el bundle sin `.all`: evita que SWAL inyecte CSS al final del DOM
 * (duplicado + orden de cascada que rompe los toasts). Los estilos base van en main.css.
 */
import Swal from 'sweetalert2/dist/sweetalert2.esm.js'
import type {
  SweetAlertCustomClass,
  SweetAlertIcon,
  SweetAlertOptions,
  SweetAlertResult,
} from 'sweetalert2'

export type { SweetAlertIcon, SweetAlertOptions, SweetAlertResult }

/** Variantes visuales alineadas con el design system */
export type MarkapAlertVariant = 'success' | 'error' | 'warning' | 'info' | 'question'

const MARKAP_CUSTOM_CLASS: SweetAlertCustomClass = {
  container: 'markap-swal-container',
  popup: 'markap-swal-popup',
  title: 'markap-swal-title',
  htmlContainer: 'markap-swal-html',
  closeButton: 'markap-swal-close',
  actions: 'markap-swal-actions',
  confirmButton: 'markap-swal-btn markap-swal-btn-confirm',
  denyButton: 'markap-swal-btn markap-swal-btn-deny',
  cancelButton: 'markap-swal-btn markap-swal-btn-cancel',
  input: 'markap-swal-input',
  validationMessage: 'markap-swal-validation',
  footer: 'markap-swal-footer',
  timerProgressBar: 'markap-swal-timer-bar',
}

function mergeCustomClass(user?: SweetAlertCustomClass): SweetAlertCustomClass {
  if (!user) return { ...MARKAP_CUSTOM_CLASS }
  const out: SweetAlertCustomClass = { ...MARKAP_CUSTOM_CLASS }
  const keys = Object.keys(user) as (keyof SweetAlertCustomClass)[]
  for (const key of keys) {
    const u = user[key]
    const b = out[key]
    if (u === undefined) continue
    if (typeof b === 'string' && typeof u === 'string') {
      out[key] = `${b} ${u}`.trim()
    } else {
      out[key] = u
    }
  }
  return out
}

function getSwalTheme(): 'light' | 'dark' | 'auto' {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

const ICON_COLORS: Record<MarkapAlertVariant, string> = {
  success: 'var(--color-success)',
  error: 'var(--color-error)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',
  question: 'var(--color-primary)',
}

const BASE_DEFAULTS: Pick<
  SweetAlertOptions,
  'buttonsStyling' | 'focusConfirm' | 'returnFocus'
> = {
  buttonsStyling: false,
  focusConfirm: false,
  returnFocus: false,
}

/** Opciones base + tema MARKAP; admite cualquier opción de SweetAlert2 */
export function markapSwalFire<T = unknown>(
  options: SweetAlertOptions,
): Promise<SweetAlertResult<Awaited<T>>> {
  return Swal.fire({
    ...BASE_DEFAULTS,
    ...options,
    customClass: mergeCustomClass(options.customClass),
  }) as Promise<SweetAlertResult<Awaited<T>>>
}

/**
 * Modal centrado: mensaje primero (`text`), título opcional después (`title`).
 * `extra` puede sobrescribir `text`, `title`, `html`, etc.
 */
function simpleAlert(
  variant: MarkapAlertVariant,
  text: string,
  title?: string,
  extra?: SweetAlertOptions,
): Promise<SweetAlertResult> {
  const merged: SweetAlertOptions = {
    icon: variant as SweetAlertIcon,
    iconColor: ICON_COLORS[variant],
    ...BASE_DEFAULTS,
    text,
    ...(title !== undefined ? { title } : {}),
    ...extra,
    customClass: mergeCustomClass(extra?.customClass),
  }
  return Swal.fire(merged)
}

export interface MarkapConfirmOptions {
  title: string
  text?: string
  html?: string
  icon?: SweetAlertIcon
  confirmText?: string
  cancelText?: string
  focusCancel?: boolean
}

export interface MarkapDangerConfirmOptions extends MarkapConfirmOptions {
  confirmText?: string
}

export interface MarkapThreeChoiceOptions {
  title: string
  text?: string
  html?: string
  confirmText?: string
  denyText?: string
  cancelText?: string
}

export type MarkapThreeChoiceResult = 'confirm' | 'deny' | 'dismiss'

export interface MarkapPromptTextOptions {
  title: string
  text?: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
  cancelText?: string
  required?: boolean
  inputAttributes?: Record<string, string>
}

export interface MarkapPromptTextareaOptions extends MarkapPromptTextOptions {
  rows?: number
}

export interface MarkapPromptSelectOptions {
  title: string
  text?: string
  /** Clave → etiqueta visible */
  options: Record<string, string>
  placeholder?: string
  confirmText?: string
  cancelText?: string
  required?: boolean
}

export interface MarkapToastDefaults {
  position?: SweetAlertOptions['position']
  timer?: number
}

/**
 * Toasts: solo API y opciones mínimas; aspecto y layout = SweetAlert2 por defecto
 * (sin clases MARKAP ni CSS que compitan con el grid oficial).
 */
const toastMixin = (defaults: MarkapToastDefaults = {}) =>
  Swal.mixin({
    toast: true,
    position: defaults.position ?? 'top-end',
    theme: getSwalTheme(),
    grow: false,
    backdrop: false,
    showConfirmButton: false,
    timer: defaults.timer ?? 4000,
    timerProgressBar: true,
    showCloseButton: true,
  })

export const markapAlert = {
  /** Cualquier diálogo con control total (recomendado para casos avanzados). */
  fire: markapSwalFire,

  /** Alerta informativa (solo Aceptar): texto del cuerpo, título opcional. */
  alert: (text: string, title?: string, extra?: SweetAlertOptions) =>
    simpleAlert('info', text, title, { showConfirmButton: true, ...extra }),

  success: (text: string, title?: string, extra?: SweetAlertOptions) =>
    simpleAlert('success', text, title, { showConfirmButton: true, ...extra }),

  error: (text: string, title?: string, extra?: SweetAlertOptions) =>
    simpleAlert('error', text, title, { showConfirmButton: true, ...extra }),

  warning: (text: string, title?: string, extra?: SweetAlertOptions) =>
    simpleAlert('warning', text, title, { showConfirmButton: true, ...extra }),

  info: (text: string, title?: string, extra?: SweetAlertOptions) =>
    simpleAlert('info', text, title, { showConfirmButton: true, ...extra }),

  /** Pregunta con icono (?); solo botón confirmar por defecto. */
  question: (text: string, title?: string, extra?: SweetAlertOptions) =>
    simpleAlert('question', text, title, { showConfirmButton: true, ...extra }),

  /** Confirmación Sí / No → `true` si confirma. */
  confirm: async (opts: MarkapConfirmOptions): Promise<boolean> => {
    const r = await markapSwalFire({
      icon: opts.icon ?? 'question',
      iconColor: opts.icon ? undefined : ICON_COLORS.question,
      title: opts.title,
      text: opts.text,
      html: opts.html,
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? 'Aceptar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
      focusCancel: opts.focusCancel ?? false,
    })
    return r.isConfirmed
  },

  /** Confirmación de acción destructiva (Eliminar, etc.). */
  confirmDanger: async (opts: MarkapDangerConfirmOptions): Promise<boolean> => {
    const r = await markapSwalFire({
      icon: opts.icon ?? 'warning',
      iconColor: ICON_COLORS.warning,
      title: opts.title,
      text: opts.text,
      html: opts.html,
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? 'Eliminar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
      focusCancel: opts.focusCancel ?? true,
    })
    return r.isConfirmed
  },

  /** Tres vías: confirmar / alternativa (deny) / cancelar. */
  threeChoice: async (opts: MarkapThreeChoiceOptions): Promise<MarkapThreeChoiceResult> => {
    const r = await markapSwalFire({
      icon: 'question',
      iconColor: ICON_COLORS.question,
      title: opts.title,
      text: opts.text,
      html: opts.html,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: opts.confirmText ?? 'Aceptar',
      denyButtonText: opts.denyText ?? 'No guardar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
    })
    if (r.isConfirmed) return 'confirm'
    if (r.isDenied) return 'deny'
    return 'dismiss'
  },

  /** Campo texto; devuelve el valor o `null` si cancela. */
  promptText: async (opts: MarkapPromptTextOptions): Promise<string | null> => {
    const r = await markapSwalFire<string>({
      title: opts.title,
      text: opts.text,
      input: 'text',
      inputPlaceholder: opts.placeholder,
      inputValue: opts.defaultValue,
      inputAttributes: opts.inputAttributes,
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? 'Aceptar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
      inputValidator: opts.required
        ? (v) => {
            if (v == null || String(v).trim() === '') return 'Este campo es obligatorio'
            return undefined
          }
        : undefined,
    })
    if (r.isConfirmed && r.value !== undefined) return String(r.value)
    return null
  },

  /** Área de texto multilínea. */
  promptTextarea: async (opts: MarkapPromptTextareaOptions): Promise<string | null> => {
    const r = await markapSwalFire<string>({
      title: opts.title,
      text: opts.text,
      input: 'textarea',
      inputPlaceholder: opts.placeholder,
      inputValue: opts.defaultValue,
      inputAttributes: {
        rows: String(opts.rows ?? 4),
        ...opts.inputAttributes,
      },
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? 'Aceptar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
      inputValidator: opts.required
        ? (v) => {
            if (v == null || String(v).trim() === '') return 'Este campo es obligatorio'
            return undefined
          }
        : undefined,
    })
    if (r.isConfirmed && r.value !== undefined) return String(r.value)
    return null
  },

  /** Lista desplegable; devuelve la clave elegida o `null`. */
  promptSelect: async (opts: MarkapPromptSelectOptions): Promise<string | null> => {
    const r = await markapSwalFire<string>({
      title: opts.title,
      text: opts.text,
      input: 'select',
      inputOptions: opts.options,
      inputPlaceholder: opts.placeholder,
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? 'Aceptar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
      inputValidator: opts.required
        ? (v) => {
            if (v == null || v === '') return 'Selecciona una opción'
            return undefined
          }
        : undefined,
    })
    if (r.isConfirmed && r.value !== undefined) return String(r.value)
    return null
  },

  /** Número. */
  promptNumber: async (
    opts: MarkapPromptTextOptions & { min?: number; max?: number; step?: number },
  ): Promise<number | null> => {
    const r = await markapSwalFire<string>({
      title: opts.title,
      text: opts.text,
      input: 'number',
      inputPlaceholder: opts.placeholder,
      inputValue: opts.defaultValue,
      inputAttributes: {
        ...opts.inputAttributes,
        ...(opts.min !== undefined ? { min: String(opts.min) } : {}),
        ...(opts.max !== undefined ? { max: String(opts.max) } : {}),
        ...(opts.step !== undefined ? { step: String(opts.step) } : {}),
      },
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? 'Aceptar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
      inputValidator: opts.required
        ? (v) => {
            if (v === '' || v == null || Number.isNaN(Number(v))) return 'Introduce un número válido'
            return undefined
          }
        : (v) => {
            if (v !== '' && v != null && Number.isNaN(Number(v))) return 'Introduce un número válido'
            return undefined
          },
    })
    if (r.isConfirmed && r.value !== undefined && r.value !== '') return Number(r.value)
    if (r.isConfirmed && (r.value === '' || r.value == null) && !opts.required) return null
    return null
  },

  /** Email con validación básica. */
  promptEmail: async (opts: MarkapPromptTextOptions): Promise<string | null> => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const r = await markapSwalFire<string>({
      title: opts.title,
      text: opts.text,
      input: 'email',
      inputPlaceholder: opts.placeholder ?? 'correo@ejemplo.com',
      inputValue: opts.defaultValue,
      inputAttributes: opts.inputAttributes,
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? 'Aceptar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
      inputValidator: (v) => {
        if (opts.required && (!v || String(v).trim() === '')) return 'Este campo es obligatorio'
        if (v && !emailRe.test(String(v))) return 'Introduce un email válido'
        return undefined
      },
    })
    if (r.isConfirmed && r.value !== undefined) return String(r.value)
    return null
  },

  /** Contraseña (oculta). */
  promptPassword: async (opts: MarkapPromptTextOptions): Promise<string | null> => {
    const r = await markapSwalFire<string>({
      title: opts.title,
      text: opts.text,
      input: 'password',
      inputPlaceholder: opts.placeholder,
      inputValue: opts.defaultValue,
      inputAttributes: opts.inputAttributes,
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? 'Aceptar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
      inputValidator: opts.required
        ? (v) => {
            if (v == null || String(v).trim() === '') return 'Este campo es obligatorio'
            return undefined
          }
        : undefined,
    })
    if (r.isConfirmed && r.value !== undefined) return String(r.value)
    return null
  },

  /** URL con validación básica. */
  promptUrl: async (opts: MarkapPromptTextOptions): Promise<string | null> => {
    const r = await markapSwalFire<string>({
      title: opts.title,
      text: opts.text,
      input: 'url',
      inputPlaceholder: opts.placeholder ?? 'https://',
      inputValue: opts.defaultValue,
      inputAttributes: opts.inputAttributes,
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? 'Aceptar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
      inputValidator: (v) => {
        if (opts.required && (!v || String(v).trim() === '')) return 'Este campo es obligatorio'
        if (v) {
          try {
            new URL(String(v))
          } catch {
            return 'Introduce una URL válida'
          }
        }
        return undefined
      },
    })
    if (r.isConfirmed && r.value !== undefined) return String(r.value)
    return null
  },

  /** Checkbox: devuelve `true` / `false` / `null` si cancela. */
  promptCheckbox: async (opts: {
    title: string
    text?: string
    label: string
    defaultChecked?: boolean
    confirmText?: string
    cancelText?: string
  }): Promise<boolean | null> => {
    const r = await markapSwalFire<boolean>({
      title: opts.title,
      text: opts.text,
      input: 'checkbox',
      inputValue: 1,
      inputPlaceholder: opts.label,
      inputAttributes: opts.defaultChecked ? { checked: 'true' } : undefined,
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? 'Aceptar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
    })
    if (r.isConfirmed) return Boolean(r.value)
    return null
  },

  /** Radio buttons; devuelve el valor elegido o `null`. */
  promptRadio: async (opts: {
    title: string
    text?: string
    options: Record<string, string>
    confirmText?: string
    cancelText?: string
  }): Promise<string | null> => {
    const r = await markapSwalFire<string>({
      title: opts.title,
      text: opts.text,
      input: 'radio',
      inputOptions: opts.options,
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? 'Aceptar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
      inputValidator: (v) => (v == null || v === '' ? 'Selecciona una opción' : undefined),
    })
    if (r.isConfirmed && r.value !== undefined) return String(r.value)
    return null
  },

  /** Rango numérico (slider). */
  promptRange: async (opts: {
    title: string
    text?: string
    min?: number
    max?: number
    step?: number
    value?: number
    confirmText?: string
    cancelText?: string
  }): Promise<number | null> => {
    const r = await markapSwalFire<string>({
      title: opts.title,
      text: opts.text,
      input: 'range',
      inputAttributes: {
        min: String(opts.min ?? 0),
        max: String(opts.max ?? 100),
        step: String(opts.step ?? 1),
      },
      inputValue: opts.value ?? opts.min ?? 0,
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? 'Aceptar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
    })
    if (r.isConfirmed && r.value !== undefined) return Number(r.value)
    return null
  },

  /** Archivo; devuelve `File | null`. */
  promptFile: async (opts: {
    title: string
    text?: string
    accept?: string
    confirmText?: string
    cancelText?: string
  }): Promise<File | null> => {
    const r = await markapSwalFire<File | string>({
      title: opts.title,
      text: opts.text,
      input: 'file',
      inputAttributes: opts.accept ? { accept: opts.accept } : undefined,
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? 'Aceptar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
    })
    if (!r.isConfirmed || r.value == null) return null
    if (r.value instanceof File) return r.value
    return null
  },

  /** Teléfono (input `tel`). */
  promptTel: async (opts: MarkapPromptTextOptions): Promise<string | null> => {
    const r = await markapSwalFire<string>({
      title: opts.title,
      text: opts.text,
      input: 'tel',
      inputPlaceholder: opts.placeholder,
      inputValue: opts.defaultValue,
      inputAttributes: opts.inputAttributes,
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? 'Aceptar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
      inputValidator: opts.required
        ? (v) => {
            if (v == null || String(v).trim() === '') return 'Este campo es obligatorio'
            return undefined
          }
        : undefined,
    })
    if (r.isConfirmed && r.value !== undefined) return String(r.value)
    return null
  },

  /** Cierra el diálogo o toast activo. */
  close: (result?: Partial<SweetAlertResult>) => Swal.close(result),

  isVisible: () => Swal.isVisible(),

  /** Spinner de carga: mensaje/cuerpo primero, título opcional (mismo criterio que los modales). */
  loading: (text = 'Cargando...', title?: string) => {
    void markapSwalFire({
      text,
      ...(title !== undefined ? { title } : {}),
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      showCancelButton: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })
  },

  /** Actualiza el diálogo abierto (título, icono, etc.). */
  update: (options: SweetAlertOptions) => Swal.update(options),

  /**
   * Toasts (esquina): título primero, texto opcional después — alineado con SweetAlert2.
   */
  toast: {
    fire: (options: SweetAlertOptions, defaults?: MarkapToastDefaults) =>
      toastMixin(defaults).fire({
        ...options,
        theme: options.theme ?? getSwalTheme(),
      }),
    success: (title: string, text?: string, defaults?: MarkapToastDefaults) =>
      toastMixin(defaults).fire({
        icon: 'success',
        title,
        text,
        theme: getSwalTheme(),
      }),
    error: (title: string, text?: string, defaults?: MarkapToastDefaults) =>
      toastMixin(defaults).fire({
        icon: 'error',
        title,
        text,
        theme: getSwalTheme(),
      }),
    warning: (title: string, text?: string, defaults?: MarkapToastDefaults) =>
      toastMixin(defaults).fire({
        icon: 'warning',
        title,
        text,
        theme: getSwalTheme(),
      }),
    info: (title: string, text?: string, defaults?: MarkapToastDefaults) =>
      toastMixin(defaults).fire({
        icon: 'info',
        title,
        text,
        theme: getSwalTheme(),
      }),
  },
}

/** Expone la misma API que `markapAlert` dentro de `setup()`. */
export function useMarkapAlert() {
  return markapAlert
}
