/**
 * Valores de formulario de agentes (Ventas); alineados con los esquemas Yup en infrastructure/schemas.
 */
export type VentasAgentCreateFormValues = {
  type: 'INTERNAL' | 'EXTERNAL'
  userId?: string
  fullName: string
  email?: string
  phone?: string
  documentTypeId?: string
  documentNumber?: string
}

export type VentasAgentEditFormValues = VentasAgentCreateFormValues & {
  isActive: boolean
}
