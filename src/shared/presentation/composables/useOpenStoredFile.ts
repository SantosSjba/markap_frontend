import { useService } from '../di/services'
import { FILE_ACCESS } from '../../application/ports/file-access.port'
import { markapAlert } from './useMarkapAlert'
import { getApiErrorMessage } from '../../utils/apiErrorMessage'
import { resolveFileDownloadUrl } from '../../utils/archivo-url'

/** Referencias posibles de un archivo guardado (archivo del gestor, ruta antigua o URL firmada) */
export interface StoredFileRef {
  archivoId?: string | null
  filePath?: string | null
  url?: string | null
}

/**
 * Abre en otra pestaña un archivo guardado (comprobantes, contratos, multimedia):
 * URL firmada → archivo del gestor → ruta antigua. Muestra un aviso si no hay archivo.
 */
export function useOpenStoredFile(applicationSlug: string) {
  const fileAccess = useService(FILE_ACCESS)
  const openUrl = (url: string) => window.open(url, '_blank', 'noopener,noreferrer')

  async function openStoredFile(file: StoredFileRef) {
    try {
      if (file.url && /^https?:\/\//i.test(file.url)) return openUrl(file.url)
      if (file.archivoId) {
        const data = await fileAccess.getDownloadUrl(encodeURIComponent(file.archivoId), { applicationSlug })
        if (data?.url) return openUrl(data.url)
      }
      const legacy = resolveFileDownloadUrl({ filePath: file.filePath ?? undefined })
      if (legacy !== '#') return openUrl(legacy)
      void markapAlert.toast.error('No hay archivo disponible')
    } catch (e) {
      void markapAlert.toast.error('No se pudo abrir el archivo', getApiErrorMessage(e))
    }
  }

  const hasStoredFile = (file: StoredFileRef) => !!(file.archivoId || file.filePath || file.url)

  return { openStoredFile, hasStoredFile }
}
