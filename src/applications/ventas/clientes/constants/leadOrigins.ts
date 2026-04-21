export type VentasLeadOriginCode =
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'WEB'
  | 'REFERIDO'
  | 'PORTAL_INMOBILIARIO'
  | 'EVENTO'
  | 'OTRO'

export const VENTAS_LEAD_ORIGIN_OPTIONS: { value: VentasLeadOriginCode; label: string }[] = [
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'WEB', label: 'Sitio web' },
  { value: 'REFERIDO', label: 'Referido' },
  { value: 'PORTAL_INMOBILIARIO', label: 'Portal inmobiliario' },
  { value: 'EVENTO', label: 'Evento / feria' },
  { value: 'OTRO', label: 'Otro' },
]

export const VENTAS_SALES_STATUS_OPTIONS: {
  value: 'PROSPECT' | 'INTERESTED' | 'CLIENT'
  label: string
}[] = [
  { value: 'PROSPECT', label: 'Prospecto' },
  { value: 'INTERESTED', label: 'Interesado' },
  { value: 'CLIENT', label: 'Cliente' },
]
