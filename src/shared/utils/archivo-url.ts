import { apiServerUrl } from '../config/env.config'
/** Resuelve URL de descarga: MinIO (presigned) o legacy /uploads. */
export function resolveFileDownloadUrl(attachment: {
  downloadUrl?: string | null
  archivoId?: string | null
  filePath?: string
}): string {
  if (attachment.downloadUrl) {
    return attachment.downloadUrl
  }
  if (attachment.filePath) {
    const path = attachment.filePath.replace(/^uploads\//, '')
    return `${apiServerUrl}/uploads/${path}`
  }
  return '#'
}
