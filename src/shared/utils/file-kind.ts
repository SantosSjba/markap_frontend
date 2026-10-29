/**
 * Tipo de un archivo para mostrarlo (ícono, etiqueta y color), según su MIME o su extensión.
 * Lo comparten las listas de adjuntos y de documentos para que un mismo archivo se vea igual.
 */
export interface FileKind {
  icon: string
  label: string
  /** Clases de fondo y color del ícono */
  tone: string
}

const KINDS: { test: (mime: string, ext: string) => boolean; kind: FileKind }[] = [
  {
    test: (m, e) => m.includes('pdf') || e === 'pdf',
    kind: { icon: 'lucide:file-text', label: 'PDF', tone: 'bg-error-50 text-error-500 dark:bg-error-500/15' },
  },
  {
    test: (m, e) => m.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'heic', 'gif'].includes(e),
    kind: { icon: 'lucide:image', label: 'Imagen', tone: 'bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15' },
  },
  {
    test: (m, e) => /sheet|excel|csv/.test(m) || ['xls', 'xlsx', 'csv'].includes(e),
    kind: { icon: 'lucide:file-spreadsheet', label: 'Excel', tone: 'bg-success-50 text-success-600 dark:bg-success-500/15' },
  },
  {
    test: (m, e) => /word|msword/.test(m) || ['doc', 'docx'].includes(e),
    kind: { icon: 'lucide:file-type', label: 'Word', tone: 'bg-brand-50 text-brand-500 dark:bg-brand-500/15' },
  },
  {
    test: (_m, e) => ['dwg', 'dxf'].includes(e),
    kind: { icon: 'lucide:drafting-compass', label: 'CAD', tone: 'bg-theme-purple-500/10 text-theme-purple-500' },
  },
]

const OTHER: FileKind = {
  icon: 'lucide:file',
  label: 'Archivo',
  tone: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

export function fileKind(name: string | null | undefined, mimeType: string | null | undefined): FileKind {
  const mime = mimeType?.toLowerCase() ?? ''
  const ext = name?.split('.').pop()?.toLowerCase() ?? ''
  return KINDS.find((k) => k.test(mime, ext))?.kind ?? OTHER
}
