export const PHASE_LABELS: Record<string, string> = {
  DESIGN: 'Diseño',
  PURCHASES: 'Compras',
  PRODUCTION: 'Producción',
  INSTALLATION: 'Instalación',
}

export const KANBAN_LABELS: Record<string, string> = {
  BACKLOG: 'Por hacer',
  IN_PROGRESS: 'En curso',
  DONE: 'Hecho',
  BLOCKED: 'Bloqueado',
}

export const EVIDENCE_LABELS: Record<string, string> = {
  PHOTO: 'Foto',
  DOCUMENT: 'Documento',
  OTHER: 'Otro',
}

export const SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
}

export const INCIDENT_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierta',
  IN_PROGRESS: 'En curso',
  CLOSED: 'Cerrada',
}

export const COST_CATEGORY_LABELS: Record<string, string> = {
  LABOR: 'Mano de obra',
  MATERIAL: 'Materiales',
  EXPENSE: 'Gastos',
}

export function formatSol(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return `S/ ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
